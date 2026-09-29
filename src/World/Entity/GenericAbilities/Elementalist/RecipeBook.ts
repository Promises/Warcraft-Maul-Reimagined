import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../Players/Defender';
import {SavePart} from '../../../Game/Saves';
import {BitReader, BitWriter} from '../../../../lib/Save/Bits';
import {SyncTrace} from '../../../../lib/SyncTrace';
import {LICH, THUNDERHEAD} from '../../../Game/Races/ElementalistPrimals';
import {RecipeBookPanel} from '../../../Game/Ui/RecipeBookPanel';

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

const KNOWN = 'ff87ceeb';
const UNKNOWN = 'ff808080';
const HEADING = 'ffffcc00';

function colour(code: string, text: string): string {
    return `|c${code}${text}|r`;
}

/**
 * Which fusions each player has discovered: the Elementalist's recipe book, kept in their save
 * (section 1). A Primal recipe is discovered by revealing it with Siphon, any other by making it.
 * Each player sees their own book in its panel (the action bar's recipe book, -book) and the
 * Primal recipes they know in Siphon's tooltip.
 */
export class RecipeBook implements SavePart {
    public readonly section = 1;
    private readonly known: Map<number, Set<string>> = new Map<number, Set<string>>();
    private readonly siphonTooltip: string;
    private readonly panel: RecipeBookPanel = new RecipeBookPanel();

    constructor(private readonly game: WarcraftMaul) {
        this.siphonTooltip = BlzGetAbilityExtendedTooltip(SIPHON, 0) ?? '';
        game.saves.register(this);
    }

    /** Opens or closes the player's book, on their screen. */
    public togglePanel(player: Defender): void {
        if (player.isLocal()) {
            this.panel.toggle();
        }
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
        this.show(player);
        return true;
    }

    /** Empties the player's book (the debug command -forget). */
    public forget(player: Defender): void {
        this.known.set(player.id, new Set<string>());
        SyncTrace.note('book', `p${player.id} forgot`);
        this.game.saves.changed(player);
        this.show(player);
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
        this.show(player);
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

    /** The player's book in the panel and Siphon's tooltip, on their own screen. */
    private show(player: Defender): void {
        if (!player.isLocal()) {
            return;
        }
        this.showInTooltip(player);
        this.showInPanel(player);
    }

    private showInPanel(player: Defender): void {
        const settings = this.game.abilityHandler.elementalistSettings;
        const all = settings.GetRecipes();
        const known = all.filter(recipe => this.knows(player, recipe.result)).length;
        const title = `${colour(HEADING, 'Recipe book')}   ${known} of ${all.length} discovered`;

        const primals: string[] = [colour(HEADING, 'Primals') + ' - two grown towers, for gold'];
        for (const primal of settings.GetPrimalRecipes()) {
            primals.push(this.knows(player, primal.result)
                ? `${colour(KNOWN, displayName(primal.result))}: ${displayName(primal.a)} + ${displayName(primal.b)}, `
                  + `${primal.fee} gold|n    it ${primal.role}`
                : `${colour(UNKNOWN, '???')}  a Primal still to discover`);
        }
        primals.push('');
        primals.push(colour(HEADING, 'First fusions') + ' - two runes, free');

        const first = all.filter(recipe => recipe.fee === 0).map(recipe => this.knows(player, recipe.result)
            ? `${colour(KNOWN, displayName(recipe.result))}: ${displayName(recipe.a)} + ${displayName(recipe.b)}`
            : colour(UNKNOWN, '???'));
        const half = math.ceil(first.length / 2);
        this.panel.setContent(title, primals.join('|n'), first.slice(0, half).join('|n'), first.slice(half).join('|n'));
    }

    /** Siphon's tooltip: the Primal recipes the player knows. */
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
        BlzSetAbilityExtendedTooltip(SIPHON, text, 0);
    }
}
