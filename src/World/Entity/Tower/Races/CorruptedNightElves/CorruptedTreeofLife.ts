import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { Unit } from "w3ts";

export class CorruptedTreeofLife extends Tower implements AttackActionTower {

    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: Unit | undefined = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (u === this.unit.handle && target) {
            if (!(this.unit.getAbilityLevel(FourCC('A091')) > 0)) {
                return;
            }

            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                target.x,
                target.y,
                bj_UNIT_FACING
            );

            tempUnit?.applyTimedLife(FourCC('BTLF'), 1.00);
            tempUnit?.addAbility(FourCC('A090'));
            tempUnit?.issueTargetOrder('chainlightning', target);
        }
    }

}
