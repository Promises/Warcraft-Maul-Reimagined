import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import {Unit} from "w3ts";

export class CorruptedIllidan extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);
        if (!this.game.gameDamageEngineGlobals.udg_IsDamageSpell) {
            return;
        }
        if (u === this.unit.handle && target) {

            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                this.unit.x,
                this.unit.y,
                bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            tempUnit?.addAbility(FourCC('A0BZ'));
            tempUnit?.issueTargetOrder('soulburn', target);
        }
    }
}
