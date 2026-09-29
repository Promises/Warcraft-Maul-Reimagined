import {WarcraftMaul} from '../../../../WarcraftMaul';
import {CREEP_TYPE} from '../../../../../lib/translators';

/** Whether the wave running is a boss wave (as the Wyvern tells it). */
export function isBossWave(game: WarcraftMaul): boolean {
    const round = game.worldMap.gameRoundHandler;
    return round !== undefined && game.worldMap.waveCreeps[round.currentWave - 1]?.getCreepType() === CREEP_TYPE.BOSS;
}
