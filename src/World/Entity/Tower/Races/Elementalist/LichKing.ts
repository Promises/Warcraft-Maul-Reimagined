import { AscendedTower } from '../../Specs/AttunedTower';

/** The Lich, ascended: keeps all it gained, gains 160 damage a wave, and 5% of its base damage a wave. */
export class LichKing extends AscendedTower {
    protected flatPerWave: number = 160;
}
