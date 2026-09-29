import {AscendedTower} from '../../Specs/AttunedTower';
import {InitialDamageModificationTower} from '../../Specs/InitialDamageModificationTower';
import {isBossWave} from './BossWave';

const BOSS_FACTOR = 1.5;

/** The Heart of Life, ascended: a boss killer, half again as strong against bosses. */
export class AvatarOfLife extends AscendedTower implements InitialDamageModificationTower {
    public InitialDamageModification(): void {
        const globals = this.game.gameDamageEngineGlobals;
        if (globals.udg_DamageEventSource === this.unit.handle && isBossWave(this.game)) {
            globals.udg_DamageEventAmount *= BOSS_FACTOR;
        }
    }
}
