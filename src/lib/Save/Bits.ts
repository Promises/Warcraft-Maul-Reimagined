/**
 * Bit-level writing and reading, most significant bit first: what the save format's sections are
 * made of. Values are packed to the bits they need, with RuneScape's "smart" numbers for sizes and
 * counts (8 bits below 128, else 16).
 *
 * Only integer operations: Warcraft III's Lua may run with 32-bit integers, so no value is wider
 * than 32 bits and nothing is divided.
 */

/** The largest number smart() holds. */
export const SMART_MAX = 0x7FFF;

export class BitWriter {
    private readonly bytes: number[] = [];
    private length: number = 0;

    /** The low `width` bits of value, 1 to 32. */
    public bits(value: number, width: number): void {
        for (let shift = width - 1; shift >= 0; shift--) {
            this.bit((value >>> shift) & 1);
        }
    }

    public bit(value: number): void {
        const index = this.length >>> 3;
        if (index === this.bytes.length) {
            this.bytes.push(0);
        }
        if (value !== 0) {
            this.bytes[index] = this.bytes[index] | (0x80 >>> (this.length & 7));
        }
        this.length++;
    }

    public flag(on: boolean): void {
        this.bit(on ? 1 : 0);
    }

    /** 0 to SMART_MAX: 8 bits below 128, else 16 with the top bit set. */
    public smart(value: number): void {
        if (value < 0 || value > SMART_MAX) {
            error(`smart value out of range: ${value}`);
        }
        if (value < 0x80) {
            this.bits(value, 8);
        } else {
            this.bits(0x8000 | value, 16);
        }
    }

    public bitSet(flags: boolean[]): void {
        this.smart(flags.length);
        for (const on of flags) {
            this.flag(on);
        }
    }

    /** A string's bytes, after its length. */
    public text(value: string): void {
        this.smart(value.length);
        for (let i = 1; i <= value.length; i++) {
            this.bits(string.byte(value, i), 8);
        }
    }

    /** Another writer's bits, as they are. */
    public append(bytes: number[], bitLength: number): void {
        const reader = new BitReader(bytes, bitLength);
        for (let i = 0; i < bitLength; i++) {
            this.bit(reader.bit());
        }
    }

    public get bitLength(): number {
        return this.length;
    }

    /** The bits written so far, the last byte padded with zeros. */
    public toBytes(): number[] {
        return [...this.bytes];
    }
}

export class BitReader {
    private position: number = 0;

    constructor(private readonly bytes: number[], private readonly length: number = bytes.length * 8) {
    }

    /** The next bit; past the end, 0, so a field an older save lacks reads as its default. */
    public bit(): number {
        const at = this.position;
        this.position++;
        if (at >= this.length) {
            return 0;
        }
        return (this.bytes[at >>> 3] >>> (7 - (at & 7))) & 1;
    }

    public bits(width: number): number {
        let value = 0;
        for (let i = 0; i < width; i++) {
            value = (value << 1) | this.bit();
        }
        return value;
    }

    public flag(): boolean {
        return this.bit() === 1;
    }

    public smart(): number {
        const first = this.bits(8);
        if (first < 0x80) {
            return first;
        }
        return ((first & 0x7F) << 8) | this.bits(8);
    }

    public bitSet(): boolean[] {
        const flags: boolean[] = [];
        for (let count = this.smart(); count > 0; count--) {
            flags.push(this.flag());
        }
        return flags;
    }

    public text(): string {
        const parts: string[] = [];
        for (let count = this.smart(); count > 0; count--) {
            parts.push(string.char(this.bits(8)));
        }
        return parts.join('');
    }

    /** Whether reading went past the end: a truncated file, when it happens outside a section. */
    public get overrun(): boolean {
        return this.position > this.length;
    }

    public get bitPosition(): number {
        return this.position;
    }
}
