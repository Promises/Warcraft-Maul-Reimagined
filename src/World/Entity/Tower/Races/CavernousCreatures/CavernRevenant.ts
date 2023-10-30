import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { Unit } from "w3ts";

export class CavernRevenant extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const attacker: Unit | undefined = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventSource);
        const target: Unit | undefined = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (attacker === this.unit && target) {
            if (this.game.gameDamageEngineGlobals.udg_DamageEventAOE !== 1) {
                return;
            }
            if (this.unit.mana < 25) {
                return;
            }

            const tempUnit = Unit.create(this.owner, FourCC('n00D'), target.x, target.y, bj_UNIT_FACING);
            this.unit.mana -= 25;
            tempUnit?.applyTimedLife(FourCC('BTLF'), 60.00);
        }
    }
}
