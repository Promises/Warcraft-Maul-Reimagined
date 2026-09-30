import {Timer} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';

const INTERVAL = 2;
const STATUS_FILE = 'WarcraftMaul\\observer-status.txt';

/**
 * For the clients of people in the game who defend no lane: a host bot (in the attackers' slot, or
 * in the observers) and any spectator. Warcraft III tells their menus nothing while a game runs,
 * not even that the players have left, and leaves an observer on a "Game over." dialog once they
 * have. So on such a client the map writes how the game stands to CustomMapData (STATUS_FILE:
 * state, wave, lives, the players still in), and once no defender is left it ends the game there,
 * which goes straight to the score screen.
 *
 * Nothing here changes the game: the file is local, and the game ends on a client with no defender
 * left to play with. The timer runs on every client (it is a handle); only a watcher's acts.
 */
export class ObserverSupport {
    // Made after the defenders are set up: a player of the game who is none of them
    private readonly observing: boolean;
    private ended: boolean = false;
    private last: string = '';

    constructor(private readonly game: WarcraftMaul) {
        const local = GetLocalPlayer();
        this.observing = !game.players.has(GetPlayerId(local)) && GetPlayerController(local) === MAP_CONTROL_USER;
        Timer.create().start(INTERVAL, true, () => this.update());
    }

    private update(): void {
        if (!this.observing || this.ended) {
            return;
        }
        const playing = [...this.game.players.values()].filter(p => p.slotState === PLAYER_SLOT_STATE_PLAYING);
        const empty = playing.length === 0;
        const round = this.game.worldMap.gameRoundHandler;
        this.write([
            `state=${empty ? 'empty' : 'playing'}`,
            `wave=${round !== undefined ? round.currentWave : 0}`,
            `lives=${this.game.gameLives}`,
            `players=${playing.map(p => p.getBattleTag()).join(',')}`,
        ]);
        if (empty) {
            this.ended = true;
            EndGame(true);
        }
    }

    /** Rewrites the file when what it says changed. Local. */
    private write(lines: string[]): void {
        const text = lines.join('\n');
        if (text === this.last) {
            return;
        }
        this.last = text;
        PreloadGenClear();
        PreloadGenStart();
        for (const line of lines) {
            Preload(line);
        }
        PreloadGenEnd(STATUS_FILE);
    }
}
