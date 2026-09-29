import {BitReader, BitWriter, SMART_MAX} from '../../src/lib/Save/Bits';
import {decodeSave, encodeSave, saveFileName, Section, Sections} from '../../src/lib/Save/SaveCodec';

type Check = (this: void, what: string, ok: boolean, detail?: string) => void;

/** Where pattern first matches, or undefined. */
function find(value: string, pattern: string, plain: boolean = false): number | undefined {
    const [start] = string.find(value, pattern, 1, plain);
    return start;
}

function section(write: (writer: BitWriter) => void): Section {
    const writer = new BitWriter();
    write(writer);
    return {bytes: writer.toBytes(), bitLength: writer.bitLength};
}

function sameSection(a: Section | undefined, b: Section): boolean {
    if (a === undefined || a.bitLength !== b.bitLength || a.bytes.length !== b.bytes.length) {
        return false;
    }
    return a.bytes.every((value, i) => value === b.bytes[i]);
}

export function saveTests(check: Check): void {
    // Every value type, at its limits
    const writer = new BitWriter();
    writer.bits(5, 3);
    writer.flag(true);
    const allOnes = (0xFFFF << 16) | 0xFFFF;
    writer.bits(allOnes, 32);
    for (const n of [0, 1, 127, 128, 1000, SMART_MAX]) {
        writer.smart(n);
    }
    writer.bitSet([true, false, false, true, true]);
    writer.text('Åse#1234');
    writer.text('');
    const reader = new BitReader(writer.toBytes(), writer.bitLength);
    check('bits', reader.bits(3) === 5);
    check('flag', reader.flag());
    check('32 bits', reader.bits(32) === allOnes);
    check('integers are 32-bit, as in the game', math.maxinteger === 0x7FFFFFFF, `${math.maxinteger}`);
    for (const n of [0, 1, 127, 128, 1000, SMART_MAX]) {
        const read = reader.smart();
        check(`smart ${n}`, read === n, `read ${read}`);
    }
    const flags = reader.bitSet();
    check('bit set', flags.join(',') === 'true,false,false,true,true', flags.join(','));
    check('text', reader.text() === 'Åse#1234');
    check('empty text', reader.text() === '');
    check('no overrun at the end', !reader.overrun);
    check('reading past the end gives 0', reader.bits(8) === 0 && reader.overrun);
    check('smart sizes', (() => {
        const small = new BitWriter();
        small.smart(127);
        const large = new BitWriter();
        large.smart(128);
        return small.bitLength === 8 && large.bitLength === 16;
    })());
    const [tooBig] = pcall(() => new BitWriter().smart(SMART_MAX + 1));
    check('smart out of range is an error', !tooBig);

    // A save round trip
    const book = section(w => w.bitSet([true, false, true, true, false, false, false, true, true]));
    const other = section(w => {
        w.text('kept by a newer map');
        w.smart(4000);
    });
    const sections: Sections = new Map([[1, book], [9, other]]);
    const name = 'Runi95#2202';
    const text = encodeSave(sections, name);
    check('save text uses the safe alphabet only', find(text, '[^%w%-_]') === undefined, text);
    check('encoding is deterministic', encodeSave(sections, name) === text);
    const decoded = decodeSave(text, name);
    check('decodes', decoded.sections !== undefined, decoded.problem);
    check('section 1 round trip', sameSection(decoded.sections?.get(1), book));
    check('an unknown section is kept', sameSection(decoded.sections?.get(9), other));
    const empty = decodeSave(encodeSave(new Map(), name), name);
    check('an empty save round trip', empty.sections !== undefined && empty.sections.size === 0, empty.problem);

    // What a save refuses
    check('another name fails the signature', decodeSave(text, 'Promises#2725').problem === 'signature');
    const letter = string.sub(text, 5, 5) === 'A' ? 'B' : 'A';
    const edited = string.sub(text, 1, 4) + letter + string.sub(text, 6);
    check('an edited letter fails the signature', decodeSave(edited, name).problem === 'signature');
    check('quotes and backslashes are not save text', decodeSave('ab"c\\d', name).problem === 'not save text');
    check('a cut file fails', decodeSave(string.sub(text, 1, text.length - 3), name).problem !== undefined);
    check('an empty file fails', decodeSave('', name).problem === 'too short');

    // The file name
    const file = saveFileName(name);
    check('file name keeps the letters', find(file, 'WarcraftMaul\\save-Runi952202-', true) === 1, file);
    check('file name ends with a hash', find(file, '%-%x%x%x%x%x%x%x%x%.txt$') !== undefined, file);
    check('names differing only in other letters get other files', saveFileName('Åse') !== saveFileName('Øse'));
    check('an empty name has a file', find(saveFileName(''), 'save-player-', true) !== undefined);
}
