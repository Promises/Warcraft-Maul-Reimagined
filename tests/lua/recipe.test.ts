import {BitReader, BitWriter} from '../../src/lib/Save/Bits';
import {primalOffer, readBook, writeBook} from '../../src/World/Entity/GenericAbilities/Elementalist/RecipeRules';

type Check = (this: void, what: string, ok: boolean, detail?: string) => void;

function flags(count: number, on: number[]): boolean[] {
    const out: boolean[] = [];
    for (let i = 0; i < count; i++) {
        out.push(on.indexOf(i) !== -1);
    }
    return out;
}

export function recipeTests(check: Check): void {
    // The free Primal: only for a full table, only once, only while one is unknown
    check('offer on a full table', primalOffer(0, false, 4));
    check('no offer with a sealed cell', !primalOffer(1, false, 4));
    check('no second free Primal', !primalOffer(0, true, 4));
    check('no offer with every Primal known', !primalOffer(0, false, 0));

    // Section 1 round trip
    const book = {known: flags(27, [0, 5, 21, 26]), given: flags(27, [26]), ascended: flags(6, [0, 5])};
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
