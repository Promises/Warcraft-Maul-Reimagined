import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import {Unit} from "w3ts";

export class Rokhan extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventTarget;

        if (u === this.unit.handle && target) {

            const tempUnit = Unit.create(
                this.owner,
                FourCC('o00H'),
                GetUnitX(target),
                GetUnitY(target),
                bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 5.00);
        }
    }
}
