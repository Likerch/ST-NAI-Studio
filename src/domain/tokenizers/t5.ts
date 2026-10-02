// T5 Unigram as the NovelAI web client runs it for V4/V4.5 (`t5_tokenizer.def`, a Hugging Face
// tokenizer.json): weight syntax removed, the Precompiled normalizer left as identity (the web
// client does the same), whitespace split, "▁" prefix, Viterbi over the vocabulary scores, one
// `</s>` per encoded text (RECON §3.16).

export interface T5Data {
    model: { vocab: [string, number][]; unk_id: number };
}

interface TrieNode {
    end: number;
    children: Map<string, TrieNode>;
}

const METASPACE = '\u2581';

export class T5Tokenizer {
    private readonly root: TrieNode = { end: -1, children: new Map() };
    private readonly scores: number[];
    private readonly unkScore: number;
    private readonly cache = new Map<string, number>();

    constructor(data: T5Data) {
        const vocab = data.model.vocab;
        this.scores = vocab.map(([, score]) => score);
        const min = vocab.reduce((m, [, score]) => Math.min(m, score), 1e6);
        this.unkScore = min - 10;
        this.scores[data.model.unk_id] = this.unkScore;
        vocab.forEach(([piece], id) => {
            // The web client walks its trie by UTF-16 units but builds it by code points, so pieces
            // with astral characters never match; skipping them keeps the counts identical.
            if (/[\uD800-\uDFFF]/.test(piece)) return;
            let node = this.root;
            for (const unit of piece) {
                let next = node.children.get(unit);
                if (!next) {
                    next = { end: -1, children: new Map() };
                    node.children.set(unit, next);
                }
                node = next;
            }
            node.end = id;
        });
    }

    /** Number of pieces on the best (Viterbi) segmentation of one pre-tokenized word. */
    private wordTokens(word: string): number {
        const cached = this.cache.get(word);
        if (cached !== undefined) return cached;
        const n = word.length;
        const best = new Array<number>(n + 1).fill(-Infinity);
        const pieces = new Array<number>(n + 1).fill(0);
        best[0] = 0;
        for (let pos = 0; pos < n; pos++) {
            const base = best[pos] as number;
            if (base === -Infinity) continue;
            let node: TrieNode | undefined = this.root;
            let singleChar = false;
            for (let end = pos; end < n && node; end++) {
                node = node.children.get(word[end] as string);
                if (!node) break;
                if (node.end >= 0) {
                    const length = end - pos + 1;
                    if (length === 1) singleChar = true;
                    const score = base + (this.scores[node.end] as number);
                    if (score > (best[end + 1] as number)) {
                        best[end + 1] = score;
                        pieces[end + 1] = (pieces[pos] as number) + 1;
                    }
                }
            }
            if (!singleChar) {
                const score = base + this.unkScore;
                if (score > (best[pos + 1] as number)) {
                    best[pos + 1] = score;
                    pieces[pos + 1] = (pieces[pos] as number) + 1;
                }
            }
        }
        const count = pieces[n] as number;
        this.cache.set(word, count);
        return count;
    }

    count(text: string): number {
        if (!text) return 1;
        const cleaned = text.replace(/[[\]{}]/g, '').replace(/-?\d*\.?\d*::/g, '');
        let total = 0;
        for (const word of cleaned.split(/\s+/)) {
            const piece = word.startsWith(METASPACE) ? word : METASPACE + word;
            total += this.wordTokens(piece);
        }
        return total + 1;
    }
}
