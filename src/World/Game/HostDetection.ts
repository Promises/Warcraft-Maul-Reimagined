import {MapPlayer, Timer} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Log} from '../../lib/Serilog/Serilog';

const ANNOUNCE_DELAY = 0.5;
const FALLBACK_DELAY = 6.0;

/**
 * Finds the game host. There is no native for it, but ReloadGameCachesFromDisk() returns true
 * only on the host's machine (other clients skip the disk read and return false), so the client
 * that gets true announces itself over PlayerSync and every client records the same host.
 *
 * If that produces nothing (it does not work on every platform), a fallback kicks in: the
 * lowest-slot player in the game, which is identical on every client, so host-only logic still
 * has a consistent owner even when the disk trick fails.
 */
export class HostDetection {
    private _host: MapPlayer | undefined;
    private detectedFromDisk: boolean = false;

    constructor(private readonly game: WarcraftMaul) {
        game.playerSync.on('host', player => this.setHost(player, true));

        Timer.create().start(ANNOUNCE_DELAY, false, () => this.announceIfHost());
        Timer.create().start(FALLBACK_DELAY, false, () => {
            if (!this._host) {
                this.applyFallback();
            }
        });
    }

    /** Runs the disk check locally and announces if this client is the host. */
    public announceIfHost(): void {
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
            this.setHost(fallback, false);
        }
    }

    private setHost(player: MapPlayer, fromDisk: boolean): void {
        // A real disk-detected host always wins over the fallback
        if (this._host && (this.detectedFromDisk || !fromDisk)) {
            return;
        }
        this._host = player;
        this.detectedFromDisk = fromDisk;
        Log.Debug(`Host ${fromDisk ? 'detected' : 'fallback'}: player ${player.id}`);
    }

    public get host(): MapPlayer | undefined {
        return this._host;
    }

    public isHost(player: MapPlayer): boolean {
        return this._host !== undefined && this._host.id === player.id;
    }

    /** For the -host command: report the current host and re-run the disk announce. */
    public report(to: MapPlayer): void {
        const source = this.detectedFromDisk ? 'disk' : 'fallback';
        const message = this._host !== undefined
            ? `Host: player ${this._host.id} (${source})`
            : 'Host: not detected yet';
        DisplayTimedTextToPlayer(to.handle, 0, 0, 10, message);
        Log.Debug(message);
        this.announceIfHost();
    }
}
