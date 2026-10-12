import { FrontmostTower } from '../../Specs/FrontmostTower';
// Its frost attack (AC01), made at build time there
import '../../GroundFrost';

/**
 * Always attacks the creep in range furthest along the path (FrontmostTower), and slows it with its
 * frost. Its splash reaches air and ground, and its range is 675 (in the map's data).
 */
export class ColdTower extends FrontmostTower {
}
