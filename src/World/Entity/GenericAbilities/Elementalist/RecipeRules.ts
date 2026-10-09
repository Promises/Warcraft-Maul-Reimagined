import {BitReader, BitWriter} from '../../../../lib/Save/Bits';

/**
 * The recipe book's rules that need no game state, so the unit tests can run them. A player who
 * has found every first fusion may take one Primal recipe free, once: a hand for a player stuck
 * on the Primals.
 */

/** Whether the player may take one Primal free: the table full, none given yet, one still unknown. */
export function primalOffer(sealedCells: number, primalGiven: boolean, unknownPrimals: number): boolean {
    return sealedCells === 0 && !primalGiven && unknownPrimals > 0;
}

/** A player's book as save section 1 holds it: bit sets over the results and the Primals. */
export interface BookBits {
    // Over RESULTS: in the book
    known: boolean[];
    // Over RESULTS: in the book because it was given (the free Primal), not found
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
