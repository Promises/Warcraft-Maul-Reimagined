import {MapPlayer, Trigger} from 'w3ts';
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
            const player = game.players.get(MapPlayer.fromEvent()!.id);
            const message = BlzGetTriggerSyncData() ?? '';
            const separator = message.indexOf(':');
            const command = separator === -1 ? message : message.substring(0, separator);
            const data = separator === -1 ? '' : message.substring(separator + 1);
            const handler = this.handlers.get(command);
            if (!player || !handler) {
                Log.Warning(`Unhandled sync message '${message}'`);
                return;
            }
            handler(player, data);
        });
    }

    public on(command: string, handler: SyncHandler): void {
        this.handlers.set(command, handler);
    }

    public send(command: string, data: string = ''): void {
        BlzSendSyncData(PlayerSync.PREFIX, data === '' ? command : `${command}:${data}`);
    }
}
