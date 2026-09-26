import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import { RandomTargeting } from '../../Specs/RandomTargeting';

/** Attacks a random enemy in range, a new one each attack. */
export class VenomTower extends Tower implements GenericAutoAttackTower {
    private readonly targeting: RandomTargeting = new RandomTargeting(this.unit);

    public GenericAttack(): void {
        this.targeting.attackStarted(GetTriggerUnit()!);
    }
}
