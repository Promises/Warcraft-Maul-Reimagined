import { AttunedTower } from '../../Specs/AttunedTower';

/**
 * A Primal (Undead L2 + Death Rune L3): keeps all of Undead's gained damage, attacks from range,
 * and gains 25 damage every wave on top of Attunement.
 */
export class Lich extends AttunedTower {
    protected flatPerWave: number = 25;
}
