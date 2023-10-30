import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import {Unit} from "w3ts";

export class ParasiticBroodmother extends Tower implements GenericAutoAttackTower {

    public GenericAttack(): void {
        const attacker: Unit | undefined = Unit.fromHandle(GetAttacker());
        const attackedUnit: Unit | undefined = Unit.fromHandle(GetAttackedUnitBJ());
        if(attackedUnit) {
            attacker?.issueTargetOrder('parasite', attackedUnit);
        }
    }

}
