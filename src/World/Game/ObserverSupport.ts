import {Timer} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';

const INTERVAL = 2;
const STATUS_FILE = 'WarcraftMaul\\observer-status.txt';

/**
 * For the observers' own clients: a host bot sits in the observers, and so may any spectator.
 * Warcraft III tells an observer's menus nothing while a game runs, not even that its players have
 * left, and leaves it on a "Game over." dialog once they have. So on an observer's client the map
 * writes how the game stands to CustomMapData (STATUS_FILE: state, wave, lives, the players still
 * in), and once no defender is left it ends the game there, which goes straight to the score screen.
 *
 * Nothing here changes the game: the file is local, and the game ends on a client with no defender
 * left to play with. The timer runs on every client (it is a handle); only an observer's acts.
 */
export class ObserverSupport {
    private readonly observing: boolean = IsPlayerObserver(GetLocalPlayer());
    private ended: boolean = false;
    private last: string = '';

    constructor(private readonly game: WarcraftMaul) {
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
