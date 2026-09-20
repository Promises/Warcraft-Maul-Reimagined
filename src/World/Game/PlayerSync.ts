import {Trigger} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {Log} from '../../lib/Serilog/Serilog';

export type SyncHandler = (player: Defender, data: string) => void;

/**
 * Runs player actions on every client.
 *
 * UI frame events only fire on the client that clicked, so anything they change in the game
 * (units, gold, handles) would happen on one machine and desync the game. A frame handler
 * instead sends a short message with BlzSendSyncData; the sync event delivers it to all
 * clients in the same order, and the handler registered for the command applies it there.
 *
 * Commands are "name" or "name:data". send() transmits as the local player, so it must only
 * be called from code that runs for the acting player's own client.
 *
 * The sender's player id is encoded into the payload rather than read from GetTriggerPlayer():
 * inside a sync event that native is unreliable across Reforged patches (it can return the
 * local player on each client), which made an action apply to every player instead of the one
 * who sent it.
 */
export class PlayerSync {
    private static readonly PREFIX = 'wm';
    private readonly handlers: Map<string, SyncHandler> = new Map<string, SyncHandler>();

    constructor(game: WarcraftMaul) {
        const trigger = Trigger.create();
        for (const player of game.players.values()) {
            trigger.registerPlayerSyncEvent(player, PlayerSync.PREFIX, false);
        }
        trigger.addAction(() => {
            // Payload is "<senderId> <command>:<data>"
            const message = BlzGetTriggerSyncData() ?? '';
            const space = message.indexOf(' ');
            const senderId = space === -1 ? -1 : Number(message.substring(0, space));
            const rest = space === -1 ? '' : message.substring(space + 1);
            const separator = rest.indexOf(':');
            const command = separator === -1 ? rest : rest.substring(0, separator);
            const data = separator === -1 ? '' : rest.substring(separator + 1);
            const player = game.players.get(senderId);
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
        });
    }

    public on(command: string, handler: SyncHandler): void {
        this.handlers.set(command, handler);
    }

    public send(command: string, data: string = ''): void {
        // Encode the sender so the handler applies the action to the right player
        const senderId = GetPlayerId(GetLocalPlayer());
        const body = data === '' ? command : `${command}:${data}`;
        BlzSendSyncData(PlayerSync.PREFIX, `${senderId} ${body}`);
    }
}
