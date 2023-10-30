import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import {Unit} from "w3ts";
import {Util} from "../../../../../lib/translators";

export class AncientProtector extends Tower implements GenericAutoAttackTower {

    public GenericAttack(): void {
        const u = Unit.fromHandle(GetAttacker());
        if (u?.handle === this.unit.handle) {
            if (!(this.unit.mana >= 30)) {
                return;
            }
            if (!(this.unit.inventorySize <= 1)) {
                return;
            }

            SetUnitManaPercentBJ(this.unit.handle, 0);
            const roll: number = Util.RandomInt(1, 3);
            switch (roll) {
                case 1:
                    this.unit.addItemById(FourCC('I023'))
                    break;
                case 2:
                    this.unit.addItemById(FourCC('I021'))
                    break;
                case 3:
                    this.unit.addItemById(FourCC('I022'))
                    break;
            }

        }
    }

}
