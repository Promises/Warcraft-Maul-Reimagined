import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import {Util} from "../../../../../lib/translators";
import {Unit} from "w3ts";

export class ZerglingHive extends Tower implements GenericAutoAttackTower {

    public GenericAttack(): void {
        if (Util.RandomInt(0, 100) >= 98 && this.owner.zerglings <= 24) {
            const tempUnit = Unit.create(
                this.owner,
                FourCC('u042'),
                this.unit.x,
                this.unit.y,
                bj_UNIT_FACING);
            this.owner.zerglings++;
            tempUnit?.applyTimedLife(FourCC('BTLF'), 10.00);
        }

    }

}
