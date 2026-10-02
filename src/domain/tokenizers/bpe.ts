// Byte-level BPE as the NovelAI web client runs it for V5 (Qwen, `qwen35_tokenizer.def`):
// NFC, special tokens split out first, the pre-tokenizer regex from the file, GPT-2 byte-to-char
// mapping, merges by rank (RECON §3.16). Counts tokens; ids are not needed.

export interface BpeData {
    vocab: Record<string, number>;
    merges: [string, string][];
    specialTokens: string[];
    config?: { splitRegex: string; normalization?: string; ignoreMerges?: boolean; maxEncodeChars?: number };
}

/** GPT-2 `bytes_to_unicode`: printable stand-ins for every byte value. */
export function byteToCharTable(): string[] {
    const printable: number[] = [];
    const push = (from: number, to: number) => {
        for (let b = from; b <= to; b++) printable.push(b);
    };
    push(0x21, 0x7e);
    push(0xa1, 0xac);
    push(0xae, 0xff);
    const table: string[] = new Array<string>(256);
    let extra = 0;
    for (let b = 0; b < 256; b++) {
        table[b] = printable.includes(b) ? String.fromCodePoint(b) : String.fromCodePoint(256 + extra++);
    }
    return table;
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class ByteBpeTokenizer {
    private readonly ranks = new Map<string, number>();
    private readonly vocab: Record<string, number>;
    private readonly byteToChar = byteToCharTable();
    private readonly encoder = new TextEncoder();
    private readonly cache = new Map<string, number>();
    private readonly special: RegExp | null;
    private readonly split: RegExp;
    private readonly normalization: string | undefined;
    private readonly ignoreMerges: boolean;

    constructor(data: BpeData) {
        this.vocab = data.vocab;
        data.merges.forEach(([left, right], rank) => this.ranks.set(`${left}\u0000${right}`, rank));
        const specials = [...data.specialTokens].sort((a, b) => b.length - a.length);
        this.special = specials.length ? new RegExp(`(${specials.map(escapeRegExp).join('|')})`) : null;
        this.split = new RegExp(
            data.config?.splitRegex ?? "'s|'t|'re|'ve|'m|'ll|'d| ?\\p{L}+| ?\\p{N}+| ?[^\\s\\p{L}\\p{N}]+|\\s+",
            'gu',
        );
        this.normalization = data.config?.normalization;
        this.ignoreMerges = data.config?.ignoreMerges === true;
    }

    private wordTokens(word: string): number {
        const cached = this.cache.get(word);
        if (cached !== undefined) return cached;
        const mapped = [...this.encoder.encode(word)].map((b) => this.byteToChar[b] as string).join('');
        let count: number;
        if (this.ignoreMerges && this.vocab[mapped] !== undefined) {
            count = 1;
        } else {
            let parts = [...mapped];
            for (;;) {
                let best = Infinity;
                let at = -1;
                for (let i = 0; i < parts.length - 1; i++) {
                    const rank = this.ranks.get(`${parts[i]}\u0000${parts[i + 1]}`);
                    if (rank !== undefined && rank < best) {
                        best = rank;
                        at = i;
                    }
                }
                if (at < 0) break;
                const left = parts[at] as string;
                const right = parts[at + 1] as string;
                const merged: string[] = [];
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i] === left && parts[i + 1] === right) {
                        merged.push(left + right);
                        i++;
                    } else {
                        merged.push(parts[i] as string);
                    }
                }
                parts = merged;
                if (parts.length === 1) break;
            }
            // The web client keeps only pieces present in the vocabulary (it has no byte fallback here).
            count = parts.filter((p) => this.vocab[p] !== undefined).length;
        }
        this.cache.set(word, count);
        return count;
    }

    count(text: string): number {
        const normalized = this.normalization ? text.normalize(this.normalization) : text;
        const chunks = this.special ? normalized.split(this.special) : [normalized];
        let total = 0;
        chunks.forEach((chunk, i) => {
            if (!chunk) return;
            // split() with a capture group puts the special tokens at odd positions.
            if (this.special && i % 2 === 1) {
                total += 1;
                return;
            }
            for (const match of chunk.matchAll(this.split)) total += this.wordTokens(match[0]);
        });
        return total;
    }
}
