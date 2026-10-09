import { Tower } from './Tower';
import { GenericAutoAttackTower } from './GenericAutoAttackTower';
import { FrontmostTargeting } from './FrontmostTargeting';

/**
 * A tower that always attacks the creep in range furthest along the path (FrontmostTargeting).
 * Any tower gets it by mapping its id to this class in its race's tower list
 * (`list.add(FourCC('h04B'), FrontmostTower)`), or by extending it when it needs more of its own.
 */
export class FrontmostTower extends Tower implements GenericAutoAttackTower {
    private readonly targeting: FrontmostTargeting = new FrontmostTargeting(this.game, this.unit);

    public GenericAttack(): void {
        this.targeting.attackStarted(GetTriggerUnit()!);
    }
}
