import {MapPlayer, Timer} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Log} from '../../lib/Serilog/Serilog';
import {readLobbyStamp} from './LobbyStamp';

const ANNOUNCE_DELAY = 0.5;
const FALLBACK_DELAY = 6.0;

type HostSource = 'lobby' | 'disk' | 'race' | 'fallback';
const SOURCE_RANK: { [source in HostSource]: number } = {lobby: 4, disk: 3, race: 2, fallback: 1};

/**
 * Finds the game host; there is no native for it. Four sources, best one wins:
 *
 * - lobby: each client stamps its wall-clock time on disk while in the lobby (LobbyStamp)
 *   and reports how long it waited; the host opened the lobby, so it waited longest. Waits
 *   are local differences, so clocks need not agree between machines.
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
    private longestLobbyWait: number = -1;

    constructor(private readonly game: WarcraftMaul) {
        game.playerSync.on('host', player => this.setHost(player, 'disk'));
        game.playerSync.on('host-race', player => this.setHost(player, 'race'));
        game.playerSync.on('host-lobby', (player, wait) => this.recordLobbyWait(player, Number(wait)));

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
        const stamp = readLobbyStamp();
        Log.Debug(`Lobby stamp: ${stamp === undefined ? 'none' : `${stamp}, waited ${os.time() - stamp}s`}`);
        if (stamp !== undefined) {
            this.game.playerSync.send('host-lobby', `${os.time() - stamp}`);
        }
    }

    /** The longest lobby wait reported so far names the host; every client sees the same reports. */
    private recordLobbyWait(player: MapPlayer, wait: number): void {
        Log.Debug(`Lobby wait: player ${player.id} ${wait}s`);
        if (isNaN(wait) || wait <= this.longestLobbyWait) {
            return;
        }
        this.longestLobbyWait = wait;
        this.setHost(player, 'lobby', true);
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

    /** A better source replaces a worse one; within a source the first answer stands unless told otherwise. */
    private setHost(player: MapPlayer, source: HostSource, replaceSameSource: boolean = false): void {
        if (this.source && (SOURCE_RANK[this.source] > SOURCE_RANK[source]
            || (this.source === source && !replaceSameSource))) {
            return;
        }
        this._host = player;
        this.source = source;
        Log.Debug(`Host (${source}): player ${player.id}`);
    }

    public get host(): MapPlayer | undefined {
        return this._host;
    }

    /** Whether a real source found the host; the lowest-slot fallback does not count. */
    public get detected(): boolean {
        return this.source !== undefined && this.source !== 'fallback';
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
