import {WarcraftMaul} from '../WarcraftMaul';
import {DecodeFourCC} from '../../lib/translators';

/**
 * What Warcraft Maul adds to wc3-slop-lan's map library when its test harness runs the map
 * (github.com/Promises/wc3-slop-lan, maps/warcraft-maul). The library brings the trace, the
 * host's command channel and the generic commands (.units, .order, .build, .gold); these hooks
 * add the map's own:
 *
 *  - a command line from the harness runs as that player's chat ("-gold 500"), or, starting
 *    with "@", as a PlayerSync message from that player ("@race-pick:I006") - what their own UI
 *    would have sent, so a test can pick, build or vote without a click;
 *  - `.towers` lists the player's towers with the class that gives each its behaviour;
 *  - the heartbeat gets lives, wave, the wave timer and creeps, and kills and towers per player;
 *  - the events that decide a game are written to the trace at once, not on the next flush.
 *
 * Does nothing when the library is absent, which is every game not started by the harness.
 */
export function installSlopHooks(game: WarcraftMaul): void {
    if (Slop === undefined) {
        return;
    }
    Slop.urgent('sync', 'pick', 'rolled', 'hybrid', 'wave', 'build', 'race', 'select', 'range');
    Slop.onCommand((slot, line) => {
        const player = game.players.get(slot);
        if (player === undefined) {
            return false;
        }
        if (line === '.towers') {
            // Every tower the player owns, with the class that gives it its behaviour (a plain
            // Tower when none is registered for its type): what a test checks registrations by
            for (const tower of player.towersArray) {
                Slop.note('tower', `p${player.id} id=${Slop.ref(tower.unit.handle)} type=${DecodeFourCC(tower.GetTypeID())}`
                    + ` class=${(tower as unknown as {constructor: {name: string}}).constructor.name}`);
            }
            Slop.note('tower', `p${player.id} end`);
            return true;
        }
        if (line.startsWith('@')) {
            game.playerSync.dispatch(`${player.id} ${line.substring(1)}`);
        } else {
            game.gameCommandHandler.runCommand(player, line);
        }
        return true;
    });
    Slop.heartbeat(() => {
        const round = game.worldMap.gameRoundHandler;
        return [
            `lives=${game.gameLives}`,
            `wave=${round !== undefined ? round.currentWave : 0}`,
            `spawning=${round !== undefined ? round.isWaveInProgress : false}`,
            // Seconds until the next wave (0 in Debug mode until one is sent)
            `timer=${game.waveTimer}`,
            `creeps=${game.worldMap.spawnedCreeps !== undefined ? game.worldMap.spawnedCreeps.unitMap.size : 0}`,
            // The generator's own state: if this drifts, the two games rolled different numbers
            `roll=${GetRandomInt(0, 0xffffff)}`,
            // Lua's generator beside it, to watch: it has stayed in step so far, which the game
            // does not promise, so game state must not depend on it (see Util.RandomInt)
            `luaroll=${Math.floor(Math.random() * 0xffffff)}`,
        ].join(' ');
    });
    Slop.playerFields(slot => {
        const player = game.players.get(slot);
        return player !== undefined ? `k=${player.kills} t=${player.towersArray.length}` : '';
    });
}
