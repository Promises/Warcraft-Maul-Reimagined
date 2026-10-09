import { Log } from '../../../../lib/Serilog/Serilog';
import {
    AVATAR_OF_LIFE, ENDLESS_STORM, EYE_OF_THE_STORM, FIRELORD, HABOOB, HEART_OF_LIFE, INFERNO, LICH, LICH_KING, NORDRASSIL,
    THUNDERHEAD, WORLD_TREE,
} from '../../../Game/Races/ElementalistPrimals';

/** A Primal fusion: two grown towers, a fee, and a line on what the Primal does, in full and short. */
export interface PrimalRecipe {
    a: string;
    b: string;
    result: string;
    fee: number;
    role: string;
    // For the recipe book's ledger, which holds about 32 letters a line
    short: string;
    // The first fusions a and b grow from (Undead L2 from Undead, Death Rune L3 from Death Rune L2)
    from: [string, string];
}

/** What a Primal ascends to: the Ascended, its fee, and a line on what it does. */
export interface Ascension {
    ascended: string;
    fee: number;
    role: string;
}

// The six Runes, in the recipe book's order (its fusion table's rows and columns)
const RUNES = ['n025', 'n024', 'n01S', 'n01R', 'n022', 'n023']; // Life, Death, Fire, Water, Nature, Air

/** Any fusion: two towers (the same one twice for a doubled rune) and what they make. */
export interface Recipe {
    a: string;
    b: string;
    result: string;
    fee: number;
}

export class ElementalistSettings {
    private readonly recipes: Recipe[] = [];
    private readonly primals: PrimalRecipe[] = [];
    private combinations: Map<string, string> = new Map<string, string>();
    // What a fusion costs in gold (Primal fusions of mature pieces); free when not listed
    private fees: Map<string, number> = new Map<string, number>();
    // How many of a tower (a fusion's or an ascension's result) a player may have; any number when not listed
    private limits: Map<string, number> = new Map<string, number>();
    // A Primal's Ascended form, its fee and its role
    private ascensions: Map<string, Ascension> = new Map<string, Ascension>();

    constructor() {
        this.SetupCombinations();
    }

    private SetupCombinations(): void {
        this.AddCombination('n025', 'n024', 'n026'); // Life + Death = Undead
        this.AddCombination('n025', 'n01S', 'u01D'); // Life + Fire = Dormant Phoenix Egg
        this.AddCombination('n01S', 'n024', 'n028'); // Fire + Death = Purgatory
        this.AddCombination('n01R', 'n024', 'n030'); // Water + Death = Corrupted Tree
        this.AddCombination('n022', 'n024', 'u01E'); // Nature + Death = Decay
        this.AddCombination('n025', 'n01R', 'u01F'); // Life + Water = Low Tide
        this.AddCombination('n024', 'n023', 'u020'); // Death + Air = Plague
        this.AddCombination('n025', 'n022', 'u021'); // Life + Nature = Sapling
        this.AddCombination('n025', 'n023', 'u022'); // Life + Air = Tornado
        this.AddCombination('n022', 'n01R', 'u023'); // Nature + Water = Moss
        this.AddCombination('n022', 'n023', 'u024'); // Nature + Air = Sandstorm
        this.AddCombination('n022', 'n01S', 'u025'); // Nature + Fire = Wildfire
        this.AddCombination('n01R', 'n023', 'u026'); // Water + Air = Bubbles
        this.AddCombination('n01R', 'n01S', 'u028'); // Water + Fire = Mist
        this.AddCombination('n01S', 'n023', 'u027'); // Fire + Air = Blaze

        this.AddDoubling('n024', 'u02A'); // Death*2 = Death Rune [Level 2]
        this.AddDoubling('n025', 'u02C'); // Life*2 = Life Rune [Level 2]
        this.AddDoubling('n022', 'u02E'); // Nature*2 = Nature Rune [Level 2]
        this.AddDoubling('n01S', 'u030'); // Fire*2 = Fire Rune [Level 2]
        this.AddDoubling('n023', 'u032'); // Air*2 = Air Rune [Level 2]
        this.AddDoubling('n01R', 'u034'); // Water*2 = Water Rune [Level 2]

        // Primal fusions of mature pieces, for a fee
        this.AddPrimal('u038', 'u02B', LICH, 250, 'keeps all the Undead\'s damage and grows 100 a wave',
            'Grows 100 damage a wave', ['n026', 'u02A']); // Undead L2 + Death Rune L3
        this.AddPrimal('u033', 'u035', THUNDERHEAD, 600, 'strikes air units with chaos splash',
            'Chaos splash against air', ['u032', 'u034']); // Air Rune L3 + Water Rune L3
        this.AddPrimal('u03D', 'u033', HABOOB, 400, 'hits up to 8 targets, air and ground',
            'Up to 8 targets, air and ground', ['u024', 'u032']); // Sandstorm L2 + Air Rune L3
        this.AddPrimal('u02D', 'u02D', HEART_OF_LIFE, 500, 'kills bosses: melee, one target, a heavy hit',
            'Boss killer: one heavy hit', ['u02C', 'u02C']); // two Life Rune L3
        this.AddPrimal('u036', 'u02F', WORLD_TREE, 400, 'splashes ground waves with siege damage',
            'Siege splash on ground waves', ['u021', 'u02E']); // Tree (from Sapling) + Nature Rune L3
        this.AddPrimal('u039', 'u031', INFERNO, 350, 'burns every enemy near it',
            'Burns every enemy near it', ['n028', 'u030']); // Purgatory L2 + Fire Rune L3

        // What each Primal ascends to, and for how much; one of each Ascended per player
        this.ascensions.set(LICH, {ascended: LICH_KING, fee: 400, role: 'Range 700, +160 damage a wave.'});
        this.ascensions.set(THUNDERHEAD, {ascended: EYE_OF_THE_STORM, fee: 500,
            role: 'About 2,100 chaos damage against air, 900 splash.'});
        this.ascensions.set(HABOOB, {ascended: ENDLESS_STORM, fee: 500, role: '8 targets, 2,000 chaos damage.'});
        this.ascensions.set(HEART_OF_LIFE, {ascended: AVATAR_OF_LIFE, fee: 600,
            role: '9,000 damage a second, half again against bosses.'});
        this.ascensions.set(WORLD_TREE, {ascended: NORDRASSIL, fee: 450,
            role: '3,000 siege damage a second; every fifth attack roots.'});
        this.ascensions.set(INFERNO, {ascended: FIRELORD, fee: 400, role: 'Burns 900 a second to every enemy within 450.'});
        for (const ascended of [LICH_KING, EYE_OF_THE_STORM, ENDLESS_STORM, AVATAR_OF_LIFE, NORDRASSIL, FIRELORD]) {
            this.limits.set(ascended, 1);
        }

    }


    private AddPrimal(a: string, b: string, result: string, fee: number, role: string, short: string,
                      from: [string, string]): void {
        this.AddCombination(a, b, result, fee);
        this.primals.push({a, b, result, fee, role, short, from});
    }

    /** The six Runes, in the recipe book's order. */
    public GetRunes(): string[] {
        return RUNES;
    }

    /** The Primal fusions, in the order they were added. */
    public GetPrimalRecipes(): PrimalRecipe[] {
        return this.primals;
    }

    /** The Primal a fusion makes, when it makes one. */
    public GetPrimalRecipe(result: string): PrimalRecipe | undefined {
        return this.primals.find(recipe => recipe.result === result);
    }

    /** Every fusion, in the order they were added: first fusions, then Primals. */
    public GetRecipes(): Recipe[] {
        return this.recipes;
    }

    private AddCombination(a: string, b: string, c: string, fee: number = 0): void {
        this.recipes.push({a, b, result: c, fee});
        this.combinations.set(a + b, c);
        this.combinations.set(b + a, c);
        if (fee > 0) {
            this.fees.set(a + b, fee);
            this.fees.set(b + a, fee);
        }
    }

    /** What a Primal ascends to, and for how much; undefined for a tower that does not ascend. */
    public GetAscension(primal: string): Ascension | undefined {
        return this.ascensions.get(primal);
    }

    /** How many towers of that type a player may have, or undefined for any number. */
    public GetLimit(result: string): number | undefined {
        return this.limits.get(result);
    }

    /** The gold a fusion costs (0 for runes). */
    public GetFee(a: string, b: string): number {
        return this.fees.get(a + b) ?? 0;
    }


    private AddDoubling(a: string, c: string): void {
        this.recipes.push({a, b: a, result: c, fee: 0});
        this.combinations.set(a + a, c);
    }

    public GetCombination(a: string, b: string): string {
        const result: string | undefined = this.combinations.get(a + b);
        if (result) {
            return result;
        }
        Log.Fatal('Combination does not exist');
        return '';

    }

    public HasCombination(a: string, b: string): boolean {
        return this.combinations.has(a + b);
    }

}
