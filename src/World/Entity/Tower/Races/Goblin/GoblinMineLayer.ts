import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import {Unit} from "w3ts";

export class GoblinMineLayer extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventTarget;

        if (u === this.unit.handle && target) {
            if (!(this.unit.mana >= 15.00)) {
                return;
            }
            const mine = Unit.create(
                this.owner,
                FourCC('h013'),
                GetUnitX(target),
                GetUnitY(target),
                bj_UNIT_FACING);
            mine?.applyTimedLife(FourCC('BTLF'), 2.00);
            this.unit.mana = this.unit.mana - 15.00;
        }
    }
}
