/**
 * The save format: a player's sections, packed, signed and scrambled with a key tied to their
 * name, as text that is safe in a preload file and a sync message. See the "Warcraft Maul Save
 * Format" design doc.
 *
 *   payload  = smart(FORMAT) smart(count) { smart(id) smart(bit length) bits }  (padded to bytes)
 *   file     = text(scramble(payload + signature))
 *
 * The signature is FNV-1a over the secret, the name and the payload; the scramble is an xorshift32
 * keystream seeded from the secret and the name. The secret ships with the (open source) map, so
 * this stops hand-editing and copying another player's file, not someone who reads this code.
 *
 * Pure functions of their arguments: every client decodes a synced save to the same result.
 */
import {BitReader, BitWriter} from './Bits';

/** A part's bits. */
export interface Section {
    bytes: number[];
    bitLength: number;
}

export type Sections = Map<number, Section>;

export type Decoded = {sections: Sections, problem?: undefined} | {sections?: undefined, problem: string};

const FORMAT = 1;
const SECRET = 'wm-save:7c1e9a4f:elementals-remember';
// Constants of 2^31 and over are built from halves: TSTL writes a literal as a decimal, which the
// game's 32-bit Lua reads as a float, and a float in a bitwise operation is an error. MASK is all
// ones in either width: 1 << 32 is 0 with 32-bit integers
const MASK = (1 << 32) - 1;
const FNV_OFFSET = (0x811C << 16) | 0x9DC5;
const FNV_PRIME = 0x01000193;
const GOLDEN = (0x9E37 << 16) | 0x79B9;
const SIGNATURE_BYTES = 4;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function stringBytes(value: string): number[] {
    const bytes: number[] = [];
    for (let i = 1; i <= value.length; i++) {
        bytes.push(string.byte(value, i));
    }
    return bytes;
}

/** FNV-1a, 32 bits, continuing from hash. */
export function fnv1a(bytes: number[], hash: number = FNV_OFFSET): number {
    for (const b of bytes) {
        hash = ((hash ^ b) * FNV_PRIME) & MASK;
    }
    return hash;
}

function nameHash(name: string, purpose: string): number {
    return fnv1a(stringBytes(`${SECRET}\n${name}\n${purpose}\n`));
}

/** XORs the bytes with an xorshift32 keystream seeded from the name; the same call undoes it. */
function scramble(bytes: number[], name: string): number[] {
    let state = nameHash(name, 'stream');
    if (state === 0) {
        state = GOLDEN;
    }
    const out: number[] = [];
    for (const b of bytes) {
        state = (state ^ (state << 13)) & MASK;
        state = state ^ (state >>> 17);
        state = (state ^ (state << 5)) & MASK;
        out.push(b ^ (state & 0xFF));
    }
    return out;
}

function signature(payload: number[], name: string): number {
    return fnv1a(payload, nameHash(name, 'signature'));
}

function toText(bytes: number[]): string {
    const reader = new BitReader(bytes);
    const letters: string[] = [];
    for (let bits = bytes.length * 8; bits > 0; bits -= 6) {
        const index = reader.bits(6);
        letters.push(ALPHABET.substring(index, index + 1));
    }
    return letters.join('');
}

function fromText(text: string): number[] | undefined {
    const writer = new BitWriter();
    for (let i = 1; i <= text.length; i++) {
        const [index] = string.find(ALPHABET, string.sub(text, i, i), 1, true);
        if (index === undefined) {
            return undefined;
        }
        writer.bits(index - 1, 6);
    }
    // Whole bytes only: the padding bits of the last letter are dropped
    return writer.toBytes().slice(0, (text.length * 6) >>> 3);
}

/** A player's sections as save text. */
export function encodeSave(sections: Sections, name: string): string {
    const writer = new BitWriter();
    writer.smart(FORMAT);
    const ids = [...sections.keys()].sort((a, b) => a - b);
    writer.smart(ids.length);
    for (const id of ids) {
        const section = sections.get(id)!;
        writer.smart(id);
        writer.smart(section.bitLength);
        writer.append(section.bytes, section.bitLength);
    }
    const payload = writer.toBytes();
    const sign = signature(payload, name);
    const signed = [...payload, (sign >>> 24) & 0xFF, (sign >>> 16) & 0xFF, (sign >>> 8) & 0xFF, sign & 0xFF];
    return toText(scramble(signed, name));
}

/** Save text back to its sections, or why it cannot be read. */
export function decodeSave(text: string, name: string): Decoded {
    const scrambled = fromText(text);
    if (scrambled === undefined) {
        return {problem: 'not save text'};
    }
    if (scrambled.length <= SIGNATURE_BYTES) {
        return {problem: 'too short'};
    }
    const signed = scramble(scrambled, name);
    const payload = signed.slice(0, signed.length - SIGNATURE_BYTES);
    const n = signed.length;
    const stored = (signed[n - 4] << 24) | (signed[n - 3] << 16) | (signed[n - 2] << 8) | signed[n - 1];
    if ((stored & MASK) !== signature(payload, name)) {
        return {problem: 'signature'};
    }
    const reader = new BitReader(payload);
    const format = reader.smart();
    if (format !== FORMAT) {
        return {problem: `format ${format}`};
    }
    const sections: Sections = new Map<number, Section>();
    for (let count = reader.smart(); count > 0; count--) {
        const id = reader.smart();
        const bitLength = reader.smart();
        const section = new BitWriter();
        for (let i = 0; i < bitLength; i++) {
            section.bit(reader.bit());
        }
        sections.set(id, {bytes: section.toBytes(), bitLength});
    }
    if (reader.overrun) {
        return {problem: 'truncated'};
    }
    return {sections};
}

/**
 * The save file of a player, under CustomMapData. One per name, so accounts sharing a computer keep
 * their own; the letters are kept for a person looking at the folder, the hash tells names apart
 * whose letters do not.
 */
export function saveFileName(name: string): string {
    const [letters] = string.gsub(name, '[^%w]', '');
    const hash = string.format('%08x', fnv1a(stringBytes(name)) & MASK);
    return `WarcraftMaul\\save-${letters === '' ? 'player' : letters}-${hash}.txt`;
}
