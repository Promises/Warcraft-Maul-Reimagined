import { Log } from '../../../../lib/Serilog/Serilog';
import { LICH } from '../../../Game/Races/ElementalistPrimals';

export class ElementalistSettings {
    private combinations: Map<string, string> = new Map<string, string>();
    // What a fusion costs in gold (Primal fusions of mature pieces); free when not listed
    private fees: Map<string, number> = new Map<string, number>();

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
        this.AddCombination('u038', 'u02B', LICH, 250); // Undead L2 + Death Rune L3 = Lich

    }


    private AddCombination(a: string, b: string, c: string, fee: number = 0): void {
        this.combinations.set(a + b, c);
        this.combinations.set(b + a, c);
        if (fee > 0) {
            this.fees.set(a + b, fee);
            this.fees.set(b + a, fee);
        }
    }

    /** The gold a fusion costs (0 for runes). */
    public GetFee(a: string, b: string): number {
        return this.fees.get(a + b) ?? 0;
    }


    private AddDoubling(a: string, c: string): void {
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
