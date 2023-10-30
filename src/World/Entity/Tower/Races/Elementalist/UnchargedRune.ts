import { Tower } from '../../Specs/Tower';
import { Defender } from '../../../Players/Defender';
import { WarcraftMaul } from '../../../../WarcraftMaul';
import { ELEMENTALIST_ABILITIES } from '../../../../GlobalSettings';
import { Log } from '../../../../../lib/Serilog/Serilog';
import { Util } from "../../../../../lib/translators";
import {Unit} from "w3ts";  // Assuming you have a Util class for array operations

export class UnchargedRune extends Tower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        this.AddAbilities();
    }

    private AddAbilities(): void {
        const nums: number[] = [];
        for (let i = 0; i < ELEMENTALIST_ABILITIES.length - 1; i++) {
            nums.push(i);
            this.unit.removeAbility(ELEMENTALIST_ABILITIES[i]);
        }

        Util.ShuffleArray(nums);

        this.unit.addAbility(ELEMENTALIST_ABILITIES[nums[0]]);
        this.unit.addAbility(ELEMENTALIST_ABILITIES[nums[1]]);
    }
}
