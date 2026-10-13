import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import { Defender } from '../../../Players/Defender';
import { WarcraftMaul } from '../../../../WarcraftMaul';
import {Unit} from "w3ts";
import {SyncTrace} from '../../../../../lib/SyncTrace';

/**
 * Its size: 30% of the model when built (its type's scale), 10% more for each minute's growth,
 * its full size after the seventh. Set with SetUnitScale, which the scale field
 * (UNIT_RF_SCALING_VALUE) does not show - it keeps the type's 0.3 - so each size is noted too.
 */
function setGolemScale(unit: Unit, mana: number): void {
    const scale: number = (30.0 + mana * 10.0) / 100.0;
    unit.setScale(scale, scale, scale);
    SyncTrace.note('golem', `${SyncTrace.unit(unit)} scale=${scale}`);
}

export class AncientGolem extends Tower implements TickingTower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        setGolemScale(this.unit, this.unit.mana);
    }

    public Action(): void {
        const mana: number = this.unit.mana + 1;
        this.unit.mana = mana;

        this.unit.setBaseDamage(this.unit.getBaseDamage(0) + 75, 0);
        // SetUnitScale takes a multiple of the model's size: the percentages here once went in as
        // they were, so the golem grew to 100 times its size
        setGolemScale(this.unit, mana);

        if (mana > 6) {
            this.game.towerTicker.RemoveTickingTower(this.UniqueID);
        }
    }

    public GetTickModulo(): number {
        return 599;
    }
}
