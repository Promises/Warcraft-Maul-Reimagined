import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../Players/Defender';
import {SavePart} from '../../../Game/Saves';
import {BitReader, BitWriter} from '../../../../lib/Save/Bits';
import {SyncTrace} from '../../../../lib/SyncTrace';
import {
    BOOK_ICONS, HABOOB, HEART_OF_LIFE, INFERNO, LICH, THUNDERHEAD, WORLD_TREE,
} from '../../../Game/Races/ElementalistPrimals';
import {BookView, LedgerRow, RecipeBookPanel, SLOT_TEXTURES, SlotContent} from '../../../Game/Ui/RecipeBookPanel';
import {findsToNextReveal, primalOffer, readBook, revealsLeft, writeBook} from './RecipeRules';
import {PrimalRecipe} from './ElementalistSettings';

const SIPHON = FourCC('A0CT');

/**
 * Every fusion result the book can hold. Its order is part of the save format (a player's book is
 * a bit set over it): append new results at the end, never reorder or remove.
 */
const RESULTS: string[] = [
    'n026', 'u01D', 'n028', 'n030', 'u01E', 'u01F', 'u020', 'u021', 'u022', 'u023', 'u024', 'u025', 'u026',
    'u028', 'u027', 'u02A', 'u02C', 'u02E', 'u030', 'u032', 'u034', LICH, THUNDERHEAD,
    HABOOB, HEART_OF_LIFE, WORLD_TREE, INFERNO,
];
// The Primals in RESULTS order: the ledger's rows, and the save's bit set of Ascended made
const PRIMALS: string[] = [LICH, THUNDERHEAD, HABOOB, HEART_OF_LIFE, WORLD_TREE, INFERNO];

/** A unit type's name without its race prefix ("[Elementalist] - Lich" is "Lich"). */
export function displayName(typeId: string): string {
    const name = GetObjectName(FourCC(typeId)) ?? typeId;
    const [short] = string.match(name, '.*%] %- (.+)$');
    return short ?? name;
}

/** "Undead - Level 2" and "Death Rune [Level 3]" as "Undead Level 2" and "Death Rune Level 3". */
function longName(typeId: string): string {
    const [dashed] = string.gsub(displayName(typeId), ' %- Level (%d)', ' Level %1');
    const [bracketed] = string.gsub(dashed, ' %[Level (%d)%]', ' Level %1');
    return bracketed;
}

/** As longName, shorter: "Undead L2", "Death Rune L3". */
function shortName(typeId: string): string {
    const [short] = string.gsub(longName(typeId), ' Level (%d)', ' L%1');
    return short;
}

/** A Rune's element: "Life" for the Life Rune. */
function element(rune: string): string {
    const [bare] = string.gsub(displayName(rune), ' Rune$', '');
    return bare;
}

/** The disabled (greyed) copy of an icon, which the game and the map keep beside it. */
function disabledIcon(icon: string): string {
    const [disabled] = string.gsub(icon, 'CommandButtons\\BTN', 'CommandButtonsDisabled\\DISBTN');
    return disabled;
}

function capitalised(text: string): string {
    return string.upper(string.sub(text, 1, 1)) + string.sub(text, 2);
}

// The book's colours (the handoff's spec)
const HEADING = 'fffcd312';
const WHITE = 'ffffffff';
const BODY = 'ffd8d8d8';
const DIM = 'ffa0a0a0';
const UNKNOWN = 'ff808080';
const GOLD = 'ffffcc00';
const ASCENDED = 'ff8fe6ea';
const HIGHLIGHT = 'ff87ceeb';

function colour(code: string, text: string): string {
    return `|c${code}${text}|r`;
}

// Tier frame alpha for an Ascended whose Primal is unknown, and for one not made yet
const ASCENDED_UNKNOWN_ALPHA = 89;
const ASCENDED_NOT_MADE_ALPHA = 178;
const ARROW_KNOWN_ALPHA = 242;
const ARROW_UNKNOWN_ALPHA = 89;

/** A player's book. */
interface Book {
    known: Set<string>;
    // In the book because it was given (a free reveal, the free Primal), not found
    given: Set<string>;
    // Primals whose Ascended this player has made, in any game
    ascended: Set<string>;
}

/** Where a player's book stands, for the free reveals (RecipeRules). */
interface Standing {
    found: number;
    revealsLeft: number;
    sealedCells: number;
    primalOffer: boolean;
}

/**
 * Which fusions each player has discovered: the Elementalist's recipe book, kept in their save
 * (section 1). A Primal recipe is discovered by revealing it with Siphon, any other by making it.
 * Every second find earns a free reveal of a first fusion, and a full fusion table one Primal free
 * (RecipeRules); what was given is kept apart from what was found. Each player sees their own book
 * in its panel (the action bar's recipe book, -book) and the Primal recipes they know in Siphon's
 * tooltip.
 */
export class RecipeBook implements SavePart {
    public readonly section = 1;
    private readonly books: Map<number, Book> = new Map<number, Book>();
    private readonly siphonTooltip: string;
    private readonly panel: RecipeBookPanel;
    // The fusion table's cells, row by row (j >= i), as the panel lays them out
    private readonly cells: string[] = [];

    constructor(private readonly game: WarcraftMaul) {
        this.siphonTooltip = BlzGetAbilityExtendedTooltip(SIPHON, 0) ?? '';
        const runes = this.settings().GetRunes();
        for (let i = 0; i < runes.length; i++) {
            for (let j = i; j < runes.length; j++) {
                this.cells.push(this.settings().GetCombination(runes[i], runes[j]));
            }
        }
        this.panel = new RecipeBookPanel(game, {
            cell: (player, index) => this.revealCell(player, this.cells[index]),
            primal: (player, index) => this.takeFreePrimal(player, PRIMALS[index]),
        });
        game.saves.register(this);
    }

    /** Opens or closes the player's book, on their screen. */
    public togglePanel(player: Defender): void {
        if (player.isLocal()) {
            this.panel.toggle();
        }
    }

    public knows(player: Defender, result: string): boolean {
        return this.bookOf(player).known.has(result);
    }

    /** Adds a result to the player's book as found; false when it was there already. */
    public discover(player: Defender, result: string): boolean {
        const book = this.bookOf(player);
        if (book.known.has(result)) {
            return false;
        }
        book.known.add(result);
        SyncTrace.note('book', `p${player.id} discovered ${result}`);
        this.changed(player);
        return true;
    }

    /** A Primal of the player's ascended: its Ascended is lit in their book from now on. */
    public markAscended(player: Defender, primal: string): void {
        const book = this.bookOf(player);
        if (PRIMALS.indexOf(primal) === -1 || book.ascended.has(primal)) {
            return;
        }
        book.ascended.add(primal);
        SyncTrace.note('book', `p${player.id} ascended ${primal}`);
        this.changed(player);
    }

    /**
     * A click on a sealed cell of the fusion table: with a free reveal left, its first fusion goes
     * in the book as given. Runs on every client with the clicker, so the rule is checked here
     * against the synced book, not against what the clicker's panel showed.
     */
    public revealCell(player: Defender, result: string): void {
        const book = this.bookOf(player);
        if (book.known.has(result) || this.standing(player).revealsLeft === 0) {
            return;
        }
        book.known.add(result);
        book.given.add(result);
        const recipe = this.settings().GetRecipes().find(r => r.result === result)!;
        player.sendMessage(`${colour(HIGHLIGHT, 'Free reveal:')} ${displayName(result)}, ${element(recipe.a)} + `
            + `${element(recipe.b)}. Siphon them to make one.`);
        SyncTrace.note('book', `p${player.id} revealed ${result}`);
        this.changed(player);
    }

    /** A click on a sealed Primal while the full table offers one free: it goes in the book as given. */
    public takeFreePrimal(player: Defender, result: string): void {
        const book = this.bookOf(player);
        if (book.known.has(result) || !this.standing(player).primalOffer) {
            return;
        }
        book.known.add(result);
        book.given.add(result);
        const recipe = this.settings().GetPrimalRecipe(result)!;
        player.sendMessage(`${colour(HIGHLIGHT, `For a full table, the ${displayName(result)}:`)} `
            + `${longName(recipe.a)} + ${longName(recipe.b)}, ${recipe.fee} gold.`);
        SyncTrace.note('book', `p${player.id} took ${result}`);
        this.changed(player);
    }

    /**
     * Debug (-learn): puts results in the player's book as found, and marks an Ascended's Primal
     * as ascended; any id that is neither is skipped. How many it took.
     */
    public learn(player: Defender, ids: string[]): number {
        let taken = 0;
        for (const id of ids) {
            const primal = PRIMALS.find(p => this.settings().GetAscension(p)?.ascended === id);
            if (primal !== undefined) {
                this.markAscended(player, primal);
                taken++;
            } else if (RESULTS.indexOf(id) !== -1) {
                this.discover(player, id);
                taken++;
            }
        }
        return taken;
    }

    /** Empties the player's book, what was given and the Ascended made (the debug command -forget). */
    public forget(player: Defender): void {
        this.books.set(player.id, {known: new Set<string>(), given: new Set<string>(), ascended: new Set<string>()});
        SyncTrace.note('book', `p${player.id} forgot`);
        this.changed(player);
    }

    public load(player: Defender, reader: BitReader | undefined): void {
        // Anything discovered before the save arrived is kept
        const book = this.bookOf(player);
        if (reader) {
            const bits = readBook(reader);
            const add = (set: Set<string>, ids: string[], flags: boolean[]) => flags.forEach((on, i) => {
                if (on && i < ids.length) {
                    set.add(ids[i]);
                }
            });
            add(book.known, RESULTS, bits.known);
            add(book.given, RESULTS, bits.given);
            add(book.ascended, PRIMALS, bits.ascended);
        }
        SyncTrace.note('book', `p${player.id} loaded ${book.known.size} given=${book.given.size} ascended=${book.ascended.size}`);
        this.show(player);
    }

    public save(player: Defender, writer: BitWriter): void {
        const book = this.bookOf(player);
        writeBook(writer, {
            known: RESULTS.map(result => book.known.has(result)),
            given: RESULTS.map(result => book.given.has(result)),
            ascended: PRIMALS.map(primal => book.ascended.has(primal)),
        });
    }

    private settings() {
        return this.game.abilityHandler.elementalistSettings;
    }

    private bookOf(player: Defender): Book {
        let book = this.books.get(player.id);
        if (!book) {
            book = {known: new Set<string>(), given: new Set<string>(), ascended: new Set<string>()};
            this.books.set(player.id, book);
        }
        return book;
    }

    private changed(player: Defender): void {
        this.game.saves.changed(player);
        this.show(player);
    }

    private standing(player: Defender): Standing {
        const book = this.bookOf(player);
        const found = RESULTS.filter(result => book.known.has(result) && !book.given.has(result)).length;
        const givenCells = this.cells.filter(cell => book.given.has(cell)).length;
        const sealedCells = this.cells.filter(cell => !book.known.has(cell)).length;
        const primalGiven = PRIMALS.some(primal => book.given.has(primal));
        const unknownPrimals = PRIMALS.filter(primal => !book.known.has(primal)).length;
        return {
            found,
            revealsLeft: revealsLeft(found, givenCells, sealedCells),
            sealedCells,
            primalOffer: primalOffer(sealedCells, primalGiven, unknownPrimals),
        };
    }

    /** The player's book in the panel and Siphon's tooltip, on their own screen. */
    private show(player: Defender): void {
        if (!player.isLocal()) {
            return;
        }
        this.showInTooltip(player);
        this.panel.show(this.view(player));
    }

    private view(player: Defender): BookView {
        const book = this.bookOf(player);
        const standing = this.standing(player);
        const settings = this.settings();
        const runes = settings.GetRunes();
        const known = RESULTS.filter(result => book.known.has(result)).length;
        const knownCells = this.cells.length - standing.sealedCells;
        const complete = known === RESULTS.length;

        let revealLine1 = '';
        let revealLine2 = '';
        if (!complete) {
            if (standing.sealedCells === 0) {
                revealLine1 = colour(DIM, 'Table full');
            } else if (standing.revealsLeft > 0) {
                revealLine1 = colour(HEADING, standing.revealsLeft === 1 ? '1 free reveal' : `${standing.revealsLeft} free reveals`);
                revealLine2 = colour(DIM, 'click a glowing cell');
            } else {
                const next = findsToNextReveal(standing.found);
                revealLine1 = colour(DIM, 'Next free reveal');
                revealLine2 = colour(DIM, next === 1 ? 'after 1 more find' : `after ${next} more finds`);
            }
        }

        const cellViews: SlotContent[] = [];
        let index = 0;
        for (let i = 0; i < runes.length; i++) {
            for (let j = i; j < runes.length; j++) {
                cellViews.push(this.cellView(book, standing, this.cells[index], runes[i], runes[j], i === j));
                index++;
            }
        }
        const primals = settings.GetPrimalRecipes();
        const knownPrimals = PRIMALS.filter(primal => book.known.has(primal)).length;
        return {
            tally: `${colour(WHITE, `${known}`)} ${colour(DIM, `of ${RESULTS.length} discovered`)}`,
            runes: runes.map(rune => ({
                icon: BOOK_ICONS[rune],
                title: displayName(rune),
                body: `${colour(DIM, 'Rune, always known.')}|nTwo of a kind make it Level 2.`,
            })),
            cells: cellViews,
            count: `${colour(WHITE, `${knownCells}`)}${colour(DIM, ` / ${this.cells.length}`)}`,
            revealLine1,
            revealLine2,
            ledgerTitle: `${colour(HEADING, 'Primals')}  ${colour(WHITE, `${knownPrimals}`)}${colour(DIM, ` / ${PRIMALS.length}`)}`,
            ledgerSubline: standing.primalOffer
                ? colour(HEADING, 'Table full: click a Primal to take it free')
                : colour(DIM, 'two grown towers, for gold'),
            ascendedHeader: `${colour(ASCENDED, 'Ascended')}|n${colour(WHITE, `${book.ascended.size}`)}`
                + `${colour(DIM, ` / ${PRIMALS.length}`)}`,
            rows: PRIMALS.map(primal => this.ledgerRow(book, standing, primals.find(p => p.result === primal)!)),
        };
    }

    private cellView(book: Book, standing: Standing, result: string, a: string, b: string, twin: boolean): SlotContent {
        const pair = `${displayName(a)} + ${displayName(b)}`;
        if (!book.known.has(result)) {
            let body = `${colour(DIM, `${pair}, free.`)}|nSiphon them together to make it.`;
            if (standing.revealsLeft > 0) {
                body += `|n${colour(GOLD, `Or click to reveal it: ${standing.revealsLeft} free `
                    + `${standing.revealsLeft === 1 ? 'reveal' : 'reveals'} left.`)}`;
            }
            return {
                icon: standing.revealsLeft > 0 ? SLOT_TEXTURES.sealedReady : SLOT_TEXTURES.sealed,
                title: colour(UNKNOWN, 'Undiscovered first fusion'),
                body,
            };
        }
        const lines = [colour(DIM, 'First fusion'), `${pair}, ${colour(GOLD, 'free')}`];
        for (const recipe of this.settings().GetPrimalRecipes()) {
            if (recipe.from.indexOf(result) !== -1) {
                lines.push(book.known.has(recipe.result)
                    ? `Grown, it goes into the ${displayName(recipe.result)}.`
                    : colour(DIM, 'Grown, it goes into a Primal you have not found.'));
            }
        }
        if (book.given.has(result)) {
            lines.push(colour(DIM, 'Revealed for free: Siphon the pair to make one.'));
        }
        return {icon: BOOK_ICONS[result], twin, title: displayName(result), body: lines.join('|n')};
    }

    private ledgerRow(book: Book, standing: Standing, recipe: PrimalRecipe): LedgerRow {
        const ascension = this.settings().GetAscension(recipe.result)!;
        const primalKnown = book.known.has(recipe.result);
        const ascendedMade = book.ascended.has(recipe.result);

        let primal: SlotContent;
        if (primalKnown) {
            const lines = [
                `${longName(recipe.a)} + ${longName(recipe.b)}, ${recipe.fee} gold`,
                capitalised(recipe.role) + '.',
                '',
                `${colour(DIM, 'Ascends after 15 waves into the')} ${colour(ASCENDED, displayName(ascension.ascended))}`,
            ];
            if (book.given.has(recipe.result)) {
                lines.push(colour(DIM, 'Your free Primal, for a full table.'));
            }
            primal = {
                icon: BOOK_ICONS[recipe.result],
                title: `${displayName(recipe.result)}  ${colour(DIM, 'Primal')}`,
                body: lines.join('|n'),
            };
        } else {
            const lines = [
                colour(DIM, 'Two grown towers and gold. One of them is a Rune at Level 3.'),
                '',
                `In battle: ${recipe.role}.`,
            ];
            if (standing.primalOffer) {
                lines.push('', colour(GOLD, 'Click to take it as your free Primal.'));
            } else if (standing.sealedCells > 0) {
                lines.push('', 'Fill the fusion table to choose one Primal free.');
            }
            primal = {
                icon: standing.primalOffer ? SLOT_TEXTURES.sealedReady : SLOT_TEXTURES.sealed,
                title: colour(UNKNOWN, 'Undiscovered Primal'),
                body: lines.join('|n'),
            };
        }

        let ascended: SlotContent;
        if (!primalKnown) {
            ascended = {
                icon: SLOT_TEXTURES.empty,
                tierAlpha: ASCENDED_UNKNOWN_ALPHA,
                title: colour(UNKNOWN, 'Sealed'),
                body: colour(DIM, 'Ascends from a Primal you have not found.'),
            };
        } else {
            const icon = BOOK_ICONS[ascension.ascended];
            ascended = {
                icon: ascendedMade ? icon : disabledIcon(icon),
                tierAlpha: ascendedMade ? 255 : ASCENDED_NOT_MADE_ALPHA,
                title: `${displayName(ascension.ascended)}  ${colour(ASCENDED, 'Ascended')}`,
                body: [
                    `The ${displayName(recipe.result)} at full Attunement (15 waves), ${ascension.fee} gold.`,
                    ascension.role,
                    colour(DIM, 'Gains 5% of its power every wave it stands, no cap. One per player.'),
                    '',
                    ascendedMade ? colour(ASCENDED, 'You have ascended it.') : colour(DIM, 'Not ascended yet.'),
                ].join('|n'),
            };
        }

        return {
            primal,
            name: primalKnown ? colour(HEADING, displayName(recipe.result)) : colour(UNKNOWN, 'Undiscovered'),
            fee: primalKnown ? colour(GOLD, `${recipe.fee} gold`) : '',
            line2: primalKnown
                ? colour(BODY, `${shortName(recipe.a)} + ${shortName(recipe.b)}`)
                : colour(UNKNOWN, recipe.short),
            line3: primalKnown ? colour(WHITE, recipe.short) : '',
            arrowAlpha: primalKnown ? ARROW_KNOWN_ALPHA : ARROW_UNKNOWN_ALPHA,
            ascended,
        };
    }

    /** Siphon's tooltip: the Primal recipes the player knows. */
    private showInTooltip(player: Defender): void {
        const recipes = this.settings().GetPrimalRecipes();
        const lines: string[] = [];
        for (const recipe of recipes) {
            if (this.knows(player, recipe.result)) {
                lines.push(`|n- ${displayName(recipe.a)} + ${displayName(recipe.b)}: ${displayName(recipe.result)} (${recipe.fee} gold)`);
            }
        }
        const unknown = recipes.length - lines.length;
        let text = this.siphonTooltip;
        if (lines.length > 0) {
            text += `|n|nPrimal recipes you know:${lines.join('')}`;
        }
        if (unknown > 0) {
            text += `|n|n${unknown} Primal ${unknown === 1 ? 'recipe' : 'recipes'} still to discover.`;
        }
        BlzSetAbilityExtendedTooltip(SIPHON, text, 0);
    }
}
