import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import {Unit} from "w3ts";

export class GoblinSapper extends Tower implements GenericAutoAttackTower {

    public GenericAttack(): void {
        const attacker: Unit | undefined = Unit.fromHandle(GetAttacker());
        attacker?.issueImmediateOrder('stomp');
    }

}
