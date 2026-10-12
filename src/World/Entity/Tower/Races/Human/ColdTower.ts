import { FrontmostTower } from '../../Specs/FrontmostTower';
// Its frost attack (AC01), made at build time there
import '../../GroundFrost';

// Its splash reached air only (area targets "air,enemies"), so on a ground wave it hit one creep;
// with ground in its splash its range is 675 (was 900, and 650 to acquire)
compiletime(({objectData}) => {
    const tower = objectData.units.get('h04B')!;
    tower.attack1AreaOfEffectTargets = 'air,enemies,ground';
    tower.attack1Range = 675;
    tower.acquisitionRange = 675;
});

/** Always attacks the creep in range furthest along the path (FrontmostTower), and slows it with its frost. */
export class ColdTower extends FrontmostTower {
}
