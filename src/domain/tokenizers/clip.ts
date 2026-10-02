// CLIP BPE as the NovelAI web client runs it for V3 (`clip_tokenizer.def`, OpenAI's
// bpe_simple_vocab_16e6): braces removed, HTML entities decoded twice, whitespace collapsed,
// lowercase, CLIP's word pattern, `</w>` word ends, 48894 merges (RECON §3.16).
import { byteToCharTable } from './bpe';

const WORD = /<\|startoftext\|>|<\|endoftext\|>|'s|'t|'re|'ve|'m|'ll|'d|[\p{L}]+|[\p{N}]|[^\s\p{L}\p{N}]+/giu;
const MERGE_COUNT = 49152 - 256 - 2;

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };

/** The few HTML entities a prompt can realistically contain (the web client uses a full decoder). */
export function decodeEntities(text: string): string {
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
        if (body[0] === '#') {
            const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
            return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
        }
        return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
    });
}

export class ClipTokenizer {
    private readonly ranks = new Map<string, number>();
    private readonly byteToChar = byteToCharTable();
    private readonly encoder = new TextEncoder();
    private readonly cache = new Map<string, number>();

    /** `mergesText` is the `text` field of the .def file: a version line, then one merge per line. */
    constructor(mergesText: string) {
        mergesText
            .split('\n')
            .slice(1, MERGE_COUNT + 1)
            .forEach((line, rank) => {
                const [left, right] = line.split(' ');
                if (left !== undefined && right !== undefined) this.ranks.set(`${left}\u0000${right}`, rank);
            });
    }

    private wordTokens(word: string): number {
        const cached = this.cache.get(word);
        if (cached !== undefined) return cached;
        const chars = [...word];
        let parts = [...chars.slice(0, -1), `${chars.at(-1) ?? ''}</w>`];
        while (parts.length > 1) {
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
        }
        this.cache.set(word, parts.length);
        return parts.length;
    }

    count(text: string): number {
        const cleaned = decodeEntities(decodeEntities(text.replace(/[[\]{}]/g, ' ').trim()).trim())
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        let total = 0;
        for (const match of cleaned.matchAll(WORD)) {
            const word = [...this.encoder.encode(match[0])].map((b) => this.byteToChar[b] as string).join('');
            total += this.wordTokens(word);
        }
        return total;
    }
}
