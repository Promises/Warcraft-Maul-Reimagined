import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import {Unit} from "w3ts";

export class ChimaeraRoost extends Tower implements TickingTower {
    public Action(): void {
        if (this.owner.chimeraCount <= 3) {
            this.owner.chimeraCount++;
            const tempUnit = Unit.create(
                this.owner,
                FourCC('e004'),
                this.unit.x,
                this.unit.y,
                bj_UNIT_FACING);
        }
    }

    public GetTickModulo(): number {
        return 150;
    }


}
