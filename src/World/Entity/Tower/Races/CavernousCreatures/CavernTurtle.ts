import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { Log } from '../../../../../lib/Serilog/Serilog';
import { Unit } from "w3ts";

export class CavernTurtle extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const attacker: Unit | undefined = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventSource);
        const target: Unit | undefined = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (attacker === this.unit && target) {
            if (this.game.gameDamageEngineGlobals.udg_DamageEventAOE !== 1) {
                return;
            }
            if (this.unit.mana < 100) {
                return;
            }

            this.unit.mana -= 100;

            const tempUnit = Unit.create(this.owner, FourCC('u008'), target.x, target.y, bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            tempUnit?.addAbility(FourCC('A0BY'));
            tempUnit?.issueImmediateOrder('fanofknives');
        }
    }
}
