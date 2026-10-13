import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import { Defender } from '../../../Players/Defender';
import { WarcraftMaul } from '../../../../WarcraftMaul';
import {Unit} from "w3ts";

/** Its size: 30% of the model when built, 10% more for each minute's growth, its full size after the seventh. */
function golemScale(mana: number): number {
    return (30.0 + mana * 10.0) / 100.0;
}

export class AncientGolem extends Tower implements TickingTower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        const scale: number = golemScale(this.unit.mana);
        this.unit.setScale(scale, scale, scale);
    }

    public Action(): void {
        const mana: number = this.unit.mana + 1;
        this.unit.mana = mana;

        this.unit.setBaseDamage(this.unit.getBaseDamage(0) + 75, 0);
        // SetUnitScale takes a multiple of the model's size: the percentages here once went in as
        // they were, so the golem grew to 100 times its size
        const scale: number = golemScale(mana);
        this.unit.setScale(scale, scale, scale);

        if (mana > 6) {
            this.game.towerTicker.RemoveTickingTower(this.UniqueID);
        }
    }

    public GetTickModulo(): number {
        return 599;
    }
}
