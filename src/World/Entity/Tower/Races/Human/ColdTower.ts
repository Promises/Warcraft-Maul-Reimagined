import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import { FrontmostTargeting } from '../../Specs/FrontmostTargeting';

/** Always attacks the creep in range that is furthest along the path, the one closest to leaking. */
export class ColdTower extends Tower implements GenericAutoAttackTower {
    private readonly targeting: FrontmostTargeting = new FrontmostTargeting(this.game, this.unit);

    public GenericAttack(): void {
        this.targeting.attackStarted(GetTriggerUnit()!);
    }
}
