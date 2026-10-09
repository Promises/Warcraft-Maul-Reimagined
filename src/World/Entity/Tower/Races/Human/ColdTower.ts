import { FrontmostTower } from '../../Specs/FrontmostTower';
// Its frost attack (AC01), made at build time there
import '../../GroundFrost';

/** Always attacks the creep in range furthest along the path (FrontmostTower), and slows it with its frost. */
export class ColdTower extends FrontmostTower {
}
