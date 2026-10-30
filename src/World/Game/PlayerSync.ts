import {MapPlayer, Trigger} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {Log} from '../../lib/Serilog/Serilog';
import {SyncTrace} from '../../lib/SyncTrace';

export type SyncHandler = (player: Defender, data: string) => void;
/** A handler for a message any player of the game may send, not only a defender. */
export type AnyPlayerHandler = (player: MapPlayer, data: string) => void;

/**
 * Runs player actions on every client.
 *
 * Used for actions whose input is local knowledge (the highlighted grid cells, the item
 * highlighted in a panel): the acting player's client sends a short message with
 * BlzSendSyncData; the sync event delivers it to all clients in the same order, and the
 * handler registered for the command applies it there.
 *
 * Commands are "name" or "name:data". send() transmits as the local player. UI frame events
 * fire on EVERY client with GetTriggerPlayer() as the clicker, so a frame handler must gate
 * its send with `GetTriggerPlayer() === GetLocalPlayer()` — otherwise every client sends and
 * the action is applied once per player.
 *
 * The sender's player id is encoded into the payload rather than read from GetTriggerPlayer():
 * inside a sync event that native is unreliable across Reforged patches (it can return the
 * local player on each client), which made an action apply to every player instead of the one
 * who sent it.
 */
export class PlayerSync {
    private static readonly PREFIX = 'wm';
    private readonly handlers: Map<string, SyncHandler> = new Map<string, SyncHandler>();
    private readonly anyPlayerHandlers: Map<string, AnyPlayerHandler> = new Map<string, AnyPlayerHandler>();
    // Commands sent only for external readers (the host bot): no handler, no "unhandled" warning.
    private readonly broadcasts: Set<string> = new Set<string>();

    constructor(private readonly game: WarcraftMaul) {
        const trigger = Trigger.create();
        // Every player of the game, defender or not: a host bot (or an observer) is a player who
        // defends no lane, and some messages are theirs too (onAnyPlayer)
        for (let i = 0; i < bj_MAX_PLAYER_SLOTS; i++) {
            const player = MapPlayer.fromIndex(i);
            if (player && player.controller === MAP_CONTROL_USER && player.slotState === PLAYER_SLOT_STATE_PLAYING) {
                trigger.registerPlayerSyncEvent(player, PlayerSync.PREFIX, false);
            }
        }
        trigger.addAction(() => this.dispatch(BlzGetTriggerSyncData() ?? ''));
    }

    /**
     * Applies one "<senderId> <command>:<data>" message as that player. Called for every sync
     * event on every client, and under the wc3-slop-lan test harness also by SlopHooks, which
     * feeds "@" commands from its host through here so a test can act as any player.
     */
    public dispatch(message: string): void {
        const space = message.indexOf(' ');
        const senderId = space === -1 ? -1 : Number(message.substring(0, space));
        const rest = space === -1 ? '' : message.substring(space + 1);
        const separator = rest.indexOf(':');
        const command = separator === -1 ? rest : rest.substring(0, separator);
        const data = separator === -1 ? '' : rest.substring(separator + 1);
        SyncTrace.note('sync', message);
        // Broadcast-only messages (for external readers like the host bot) have no handler here;
        // every client still traces them, nothing in the map acts on them.
        if (this.broadcasts.has(command)) {
            return;
        }
        const anyPlayer = this.anyPlayerHandlers.get(command);
        if (anyPlayer) {
            const sender = MapPlayer.fromIndex(senderId);
            if (!sender) {
                Log.Warning(`Unhandled sync message '${message}'`);
                return;
            }
            try {
                anyPlayer(sender, data);
            } catch (error) {
                Log.Error(`sync '${message}' failed: ${error}`);
            }
            return;
        }
        const player = this.game.players.get(senderId);
        const handler = this.handlers.get(command);
        if (!player || !handler) {
            Log.Warning(`Unhandled sync message '${message}'`);
            return;
        }
        // A Lua error inside a trigger action is otherwise swallowed without a trace
        try {
            handler(player, data);
        } catch (error) {
            Log.Error(`sync '${message}' failed: ${error}`);
        }
    }

    public on(command: string, handler: SyncHandler): void {
        this.handlers.set(command, handler);
    }

    /** A command any player of the game may send, a defender or not (host detection). */
    public onAnyPlayer(command: string, handler: AnyPlayerHandler): void {
        this.anyPlayerHandlers.set(command, handler);
    }

    public send(command: string, data: string = ''): void {
        // Encode the sender so the handler applies the action to the right player
        const senderId = GetPlayerId(GetLocalPlayer());
        const body = data === '' ? command : `${command}:${data}`;
        BlzSendSyncData(PlayerSync.PREFIX, `${senderId} ${body}`);
    }

    /**
     * A map-global broadcast for external readers (the host bot): sent once, from the lowest
     * playing slot only, so every client doesn't duplicate it. What's behind it (a vote result,
     * a synced roll, the wave number) is already the same on every client, so which client sends
     * it doesn't matter.
     */
    public sendGlobal(command: string, data: string = ''): void {
        // The lowest slot still PLAYING sends - not merely the lowest in game.players. A player who
        // leaves is removed from game.players only once their towers have distributed, but their slot
        // state flips to LEFT at the same synced moment on every client; keying on that keeps exactly
        // one live sender across a leave, with no window where the gone player is still "lowest".
        let lowest: number = -1;
        for (const id of this.game.players.keys()) {
            if (GetPlayerSlotState(Player(id)!) === PLAYER_SLOT_STATE_PLAYING && (lowest === -1 || id < lowest)) {
                lowest = id;
            }
        }
        if (lowest !== -1 && GetLocalPlayer() === Player(lowest)) {
            this.send(command, data);
        }
    }

    /** Marks a command as broadcast-only: the map sends it for external readers; no handler, no warning. */
    public registerBroadcast(command: string): void {
        this.broadcasts.add(command);
    }
}
