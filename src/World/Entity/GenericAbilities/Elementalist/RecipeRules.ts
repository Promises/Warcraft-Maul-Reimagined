import {BitReader, BitWriter} from '../../../../lib/Save/Bits';

// Every this many finds earn one free reveal
export const FINDS_PER_REVEAL = 2;

/**
 * The recipe book's free reveals, as numbers (the Fusion Table spec, "Free reveals"). A find is a
 * result in the book the player was not given; every second find earns a free reveal, spent on a
 * sealed first fusion. Pure: no game state, so the unit tests can run it.
 */

/** Free reveals the player may spend now: none once the table has no sealed cell. */
export function revealsLeft(found: number, givenFirstFusions: number, sealedCells: number): number {
    if (sealedCells === 0) {
        return 0;
    }
    return math.max(0, math.floor(found / FINDS_PER_REVEAL) - givenFirstFusions);
}

/** Finds until the next free reveal: 1 or 2. */
export function findsToNextReveal(found: number): number {
    return FINDS_PER_REVEAL - found % FINDS_PER_REVEAL;
}

/** Whether the player may take one Primal free: the table full, none given yet, one still unknown. */
export function primalOffer(sealedCells: number, primalGiven: boolean, unknownPrimals: number): boolean {
    return sealedCells === 0 && !primalGiven && unknownPrimals > 0;
}

/** A player's book as save section 1 holds it: bit sets over the results and the Primals. */
export interface BookBits {
    // Over RESULTS: in the book
    known: boolean[];
    // Over RESULTS: in the book because it was given, not found
    given: boolean[];
    // Over the Primals in RESULTS order: Ascended this player has made
    ascended: boolean[];
}

/** Section 1, in its order; it only ever grows at its end (docs/save-format.md). */
export function writeBook(writer: BitWriter, book: BookBits): void {
    writer.bitSet(book.known);
    writer.bitSet(book.given);
    writer.bitSet(book.ascended);
}

/** Section 1; a field an older save lacks reads as an empty bit set. */
export function readBook(reader: BitReader): BookBits {
    const known = reader.bitSet();
    const given = reader.bitSet();
    const ascended = reader.bitSet();
    return {known, given, ascended};
}
