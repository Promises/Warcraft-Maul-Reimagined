import { AttunedTower } from '../../Specs/AttunedTower';

/** Gains 5 damage every wave. Not a mature piece: no Attunement, but its damage carries into Level 2. */
export class Undead extends AttunedTower {
    protected flatPerWave: number = 5;
    protected cap: number = 0;
}
