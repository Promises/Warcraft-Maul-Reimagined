import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../Players/Defender';
import {SavePart} from '../../../Game/Saves';
import {BitReader, BitWriter} from '../../../../lib/Save/Bits';
import {SyncTrace} from '../../../../lib/SyncTrace';
import {LICH, THUNDERHEAD} from '../../../Game/Races/ElementalistPrimals';

const SIPHON = FourCC('A0CT');

/**
 * Every fusion result the book can hold. Its order is part of the save format (a player's book is
 * a bit set over it): append new results at the end, never reorder or remove.
 */
const RESULTS: string[] = [
    'n026', 'u01D', 'n028', 'n030', 'u01E', 'u01F', 'u020', 'u021', 'u022', 'u023', 'u024', 'u025', 'u026',
    'u028', 'u027', 'u02A', 'u02C', 'u02E', 'u030', 'u032', 'u034', LICH, THUNDERHEAD,
];

/** A unit type's name without its race prefix ("[Elementalist] - Lich" is "Lich"). */
export function displayName(typeId: string): string {
    const name = GetObjectName(FourCC(typeId)) ?? typeId;
    const [short] = string.match(name, '.*%] %- (.+)$');
    return short ?? name;
}

/**
 * Which fusions each player has discovered: the Elementalist's recipe book, kept in their save
 * (section 1). A Primal recipe is discovered by revealing it with Siphon, any other by making it.
 * Siphon's tooltip shows each player the Primal recipes they know.
 */
export class RecipeBook implements SavePart {
    public readonly section = 1;
    private readonly known: Map<number, Set<string>> = new Map<number, Set<string>>();
    private readonly siphonTooltip: string;

    constructor(private readonly game: WarcraftMaul) {
        this.siphonTooltip = BlzGetAbilityExtendedTooltip(SIPHON, 0) ?? '';
        game.saves.register(this);
    }

    public knows(player: Defender, result: string): boolean {
        return this.known.get(player.id)?.has(result) ?? false;
    }

    /** Adds a result to the player's book; false when it was there already. */
    public discover(player: Defender, result: string): boolean {
        const book = this.bookOf(player);
        if (book.has(result)) {
            return false;
        }
        book.add(result);
        SyncTrace.note('book', `p${player.id} discovered ${result}`);
        this.game.saves.changed(player);
        this.showInTooltip(player);
        return true;
    }

    /** Empties the player's book (the debug command -forget). */
    public forget(player: Defender): void {
        this.known.set(player.id, new Set<string>());
        SyncTrace.note('book', `p${player.id} forgot`);
        this.game.saves.changed(player);
        this.showInTooltip(player);
    }

    public load(player: Defender, reader: BitReader | undefined): void {
        // Anything discovered before the save arrived is kept
        const book = this.bookOf(player);
        const flags = reader ? reader.bitSet() : [];
        flags.forEach((on, i) => {
            if (on && i < RESULTS.length) {
                book.add(RESULTS[i]);
            }
        });
        SyncTrace.note('book', `p${player.id} loaded ${book.size}`);
        this.showInTooltip(player);
    }

    public save(player: Defender, writer: BitWriter): void {
        const book = this.bookOf(player);
        writer.bitSet(RESULTS.map(result => book.has(result)));
    }

    private bookOf(player: Defender): Set<string> {
        let book = this.known.get(player.id);
        if (!book) {
            book = new Set<string>();
            this.known.set(player.id, book);
        }
        return book;
    }

    /** Siphon's tooltip, on the player's own screen: the Primal recipes they know. */
    private showInTooltip(player: Defender): void {
        const recipes = this.game.abilityHandler.elementalistSettings.GetPrimalRecipes();
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
        if (player.handle === GetLocalPlayer()) {
            BlzSetAbilityExtendedTooltip(SIPHON, text, 0);
        }
    }
}
