import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import {Unit} from "w3ts";

export class SirGalahad extends Tower implements GenericAutoAttackTower {

    public GenericAttack(): void {
        const attacker = Unit.fromHandle(GetAttacker());
        attacker?.issueImmediateOrder('spiritwolf');
    }

}
