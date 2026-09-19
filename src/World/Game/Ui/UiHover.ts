import {Frame, MapPlayer, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';

/**
 * Keeps `Defender.pointerOverUi` in sync with the mouse entering and leaving custom
 * frames, so world mouse clicks that land on our UI are not treated as map clicks.
 */
export function trackHover(game: WarcraftMaul, frame: Frame): void {
    const trigger = Trigger.create();
    trigger.triggerRegisterFrameEvent(frame, FRAMEEVENT_MOUSE_ENTER);
    trigger.triggerRegisterFrameEvent(frame, FRAMEEVENT_MOUSE_LEAVE);
    trigger.addAction(() => {
        const player = game.players.get(MapPlayer.fromEvent()!.id);
        if (player) {
            player.pointerOverUi = Frame.getEventHandle() === FRAMEEVENT_MOUSE_ENTER;
        }
    });
}
