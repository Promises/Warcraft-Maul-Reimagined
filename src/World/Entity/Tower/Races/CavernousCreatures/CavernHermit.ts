import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import { Unit } from "w3ts";

export class CavernHermit extends Tower implements AttackActionTower, GenericAutoAttackTower {
    public AttackAction(): void {
        if (!this.game.gameDamageEngineGlobals.udg_IsDamageSpell) {
            return;
        }

        const sourceUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventSource);
        const targetUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (sourceUnit === this.unit && targetUnit) {
            if (Math.floor(Math.random() * 3) + 1 !== 1) {
                return;
            }

            const tempUnit = Unit.create(this.owner, FourCC('u008'), sourceUnit.x, sourceUnit.y, bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            tempUnit?.addAbility(FourCC('A0CC'));
            tempUnit?.issueOrderAt("lightningshield", targetUnit.x, targetUnit.y);
        }
    }

    public GenericAttack(): void {
        this.CastSpellOnAttackedUnitLocation('carrionswarm');
    }
}
