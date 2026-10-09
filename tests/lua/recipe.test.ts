import {BitReader, BitWriter} from '../../src/lib/Save/Bits';
import {
    findsToNextReveal, primalOffer, readBook, revealsLeft, writeBook,
} from '../../src/World/Entity/GenericAbilities/Elementalist/RecipeRules';

type Check = (this: void, what: string, ok: boolean, detail?: string) => void;

const FIRST_FUSIONS = 21;

function flags(count: number, on: number[]): boolean[] {
    const out: boolean[] = [];
    for (let i = 0; i < count; i++) {
        out.push(on.indexOf(i) !== -1);
    }
    return out;
}

export function recipeTests(check: Check): void {
    // Every second find earns a reveal; given ones are spent
    check('no finds, no reveal', revealsLeft(0, 0, FIRST_FUSIONS) === 0);
    check('one find, no reveal', revealsLeft(1, 0, 20) === 0);
    check('two finds, one reveal', revealsLeft(2, 0, 19) === 1);
    check('a spent reveal', revealsLeft(3, 1, 17) === 0, `${revealsLeft(3, 1, 17)}`);
    check('never below zero', revealsLeft(2, 3, 10) === 0);
    check('a full table offers none', revealsLeft(30, 0, 0) === 0);
    check('next reveal after 1 more find', findsToNextReveal(1) === 1);
    check('next reveal after 2 more finds', findsToNextReveal(4) === 2);

    // The spec's example: 14 finds and 7 free reveals fill the table
    let found = 0;
    let given = 0;
    let sealed = FIRST_FUSIONS;
    while (found < 14) {
        found++;
        sealed--;
        while (revealsLeft(found, given, sealed) > 0) {
            given++;
            sealed--;
        }
    }
    check('14 finds and 7 reveals fill the table', sealed === 0 && given === 7, `sealed ${sealed}, given ${given}`);

    // An old save, every past find counted: its reveals at once
    check('a returning player gets their reveals', revealsLeft(10, 0, 11) === 5);

    // The free Primal: only for a full table, only once, only while one is unknown
    check('offer on a full table', primalOffer(0, false, 4));
    check('no offer with a sealed cell', !primalOffer(1, false, 4));
    check('no second free Primal', !primalOffer(0, true, 4));
    check('no offer with every Primal known', !primalOffer(0, false, 0));

    // Section 1 round trip
    const book = {known: flags(27, [0, 5, 21, 26]), given: flags(27, [5, 26]), ascended: flags(6, [0, 5])};
    const writer = new BitWriter();
    writeBook(writer, book);
    const read = readBook(new BitReader(writer.toBytes(), writer.bitLength));
    check('known survives', read.known.join(',') === book.known.join(','));
    check('given survives', read.given.join(',') === book.given.join(','));
    check('ascended survives', read.ascended.join(',') === book.ascended.join(','));

    // A save from before the given and ascended fields: the book only
    const old = new BitWriter();
    old.bitSet(flags(27, [0, 1, 2]));
    const fromOld = readBook(new BitReader(old.toBytes(), old.bitLength));
    check('an old save keeps its book', fromOld.known.filter(on => on).length === 3);
    check('an old save has nothing given', fromOld.given.length === 0);
    check('an old save has nothing ascended', fromOld.ascended.length === 0);
}
