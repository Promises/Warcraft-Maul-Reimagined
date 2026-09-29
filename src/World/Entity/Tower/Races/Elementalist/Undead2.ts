import { AttunedTower } from '../../Specs/AttunedTower';

/**
 * Gains 15 damage every wave, on top of what it had gained as Undead (it once started again from
 * its base), and Attunement as a mature piece. Fused with a Death Rune L3 it becomes the Lich.
 */
export class Undead2 extends AttunedTower {
    protected flatPerWave: number = 15;
}
