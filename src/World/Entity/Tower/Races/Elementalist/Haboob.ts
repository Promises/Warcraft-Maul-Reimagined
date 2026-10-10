import {Unit} from 'w3ts';
import {AscendedTower, AttunedTower} from '../../Specs/AttunedTower';
import {Defender} from '../../../Players/Defender';
import {WarcraftMaul} from '../../../../WarcraftMaul';
import {TowerTooltip} from '../../TowerTooltips';

// Sandstorm's Barrage, which the Haboob keeps: set per tower, so the Sandstorm keeps its own
const MULTISHOT = FourCC('A0E4');
// Barrage's target field: it hits one more than this besides the target it attacks (measured:
// 7 gave 9 targets a volley), so 8 in all
const EXTRA_TARGETS = 6;
const AREA = 500;

function tuneMultishot(unit: Unit): void {
    const ability = BlzGetUnitAbility(unit.handle, MULTISHOT);
    if (ability) {
        BlzSetAbilityIntegerLevelField(ability, ABILITY_ILF_MAXIMUM_NUMBER_OF_TARGETS_EFK3, 0, EXTRA_TARGETS);
        BlzSetAbilityRealLevelField(ability, ABILITY_RLF_AREA_OF_EFFECT, 0, AREA);
    }
}

// Its tooltip is the Sandstorm's (7, in the string table) but for these towers
const MULTISHOT_TOOLTIP: TowerTooltip = {ability: MULTISHOT, text: `This tower can hit ${EXTRA_TARGETS + 2} enemies in one attack`};

/** A Primal (Sandstorm L2 + Air Rune L3): hits up to 8 targets, air and ground. Grows by Attunement. */
export class Haboob extends AttunedTower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        tuneMultishot(this.unit);
    }

    public abilityTooltips(): TowerTooltip[] {
        return super.abilityTooltips().concat([MULTISHOT_TOOLTIP]);
    }
}

/** The Haboob, ascended. */
export class EndlessStorm extends AscendedTower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        tuneMultishot(this.unit);
    }

    public abilityTooltips(): TowerTooltip[] {
        return super.abilityTooltips().concat([MULTISHOT_TOOLTIP]);
    }
}
