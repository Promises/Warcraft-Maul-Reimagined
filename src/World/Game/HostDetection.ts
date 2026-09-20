import {MapPlayer, Timer} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Log} from '../../lib/Serilog/Serilog';

const ANNOUNCE_DELAY = 0.5;
const FALLBACK_DELAY = 6.0;

type HostSource = 'disk' | 'race' | 'fallback';
const SOURCE_RANK: { [source in HostSource]: number } = {disk: 3, race: 2, fallback: 1};

/**
 * Finds the game host; there is no native for it. Three sources, best one wins:
 *
 * - disk: ReloadGameCachesFromDisk() returns true only on the host's machine, so that client
 *   announces itself. Does not work on every platform (dead on macOS).
 * - race: every client sends a sync message at the same game time. The host's own message
 *   enters the shared stream without a network hop while everyone else's has to reach the
 *   host first, so the first message to arrive is the host's - and the arrival order is the
 *   same on every client, so they all agree. This is the wait-time asymmetry between the
 *   host and the joiners, measured from game start, the only clock the sandbox has.
 * - fallback: the lowest-slot player, identical everywhere, so host-only logic always has
 *   a consistent owner.
 */
export class HostDetection {
    private _host: MapPlayer | undefined;
    private source: HostSource | undefined;

    constructor(private readonly game: WarcraftMaul) {
        game.playerSync.on('host', player => this.setHost(player, 'disk'));
        game.playerSync.on('host-race', player => this.setHost(player, 'race'));

        Timer.create().start(ANNOUNCE_DELAY, false, () => this.announce());
        Timer.create().start(FALLBACK_DELAY, false, () => {
            if (!this._host) {
                this.applyFallback();
            }
        });
    }

    /**
     * Runs on every client: each sends its race entry as itself, and the one whose disk
     * check passes announces that too.
     */
    public announce(): void {
        this.game.playerSync.send('host-race');
        if (ReloadGameCachesFromDisk()) {
            this.game.playerSync.send('host');
        }
    }

    /** Lowest-slot player; deterministic across clients. */
    private lowestSlotPlayer(): MapPlayer | undefined {
        let lowest: MapPlayer | undefined;
        for (const player of this.game.players.values()) {
            if (!lowest || player.id < lowest.id) {
                lowest = player;
            }
        }
        return lowest;
    }

    private applyFallback(): void {
        const fallback = this.lowestSlotPlayer();
        if (fallback) {
            this.setHost(fallback, 'fallback');
        }
    }

    /** A better source replaces a worse one; within a source the first answer stands. */
    private setHost(player: MapPlayer, source: HostSource): void {
        if (this.source && SOURCE_RANK[this.source] >= SOURCE_RANK[source]) {
            return;
        }
        this._host = player;
        this.source = source;
        Log.Debug(`Host (${source}): player ${player.id}`);
    }

    public get host(): MapPlayer | undefined {
        return this._host;
    }

    public isHost(player: MapPlayer): boolean {
        return this._host !== undefined && this._host.id === player.id;
    }

    /** For the -host command: report the current host and its source. */
    public report(to: MapPlayer): void {
        const message = this._host !== undefined
            ? `Host: player ${this._host.id} (${this.source})`
            : 'Host: not detected yet';
        DisplayTimedTextToPlayer(to.handle, 0, 0, 10, message);
        Log.Debug(message);
    }
}
