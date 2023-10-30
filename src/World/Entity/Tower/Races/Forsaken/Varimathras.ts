import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import { Unit } from "w3ts";

export class Varimathras extends Tower implements GenericAutoAttackTower {

    public GenericAttack(): void {
        const attacker: unit | undefined = GetAttacker();
        const attackedUnit: Unit | undefined = Unit.fromHandle(GetAttackedUnitBJ());

        if (attacker === this.unit.handle && attackedUnit) {
            this.unit.issueTargetOrder('doom', attackedUnit);
        }
    }

}
