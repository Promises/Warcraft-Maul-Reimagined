import {Frame, MapPlayer, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';

/**
 * Notes a mouse press on a custom control, so a world click that lands on our UI is not
 * taken for a map click (the hybrid build mode places towers on map clicks).
 *
 * Never register FRAMEEVENT_MOUSE_ENTER/LEAVE on a frame: with those registered the engine
 * drops and regains the frame's hover on every game tick (a leave and an enter within the
 * same millisecond, every 25 to 40 ms), and the tooltip, highlight and cursor flicker. Mouse
 * down/up and click events do not have that effect, and neither do engine tooltips.

 */
export function trackUiPress(game: WarcraftMaul, control: Frame): void {
    const trigger = Trigger.create();
    trigger.triggerRegisterFrameEvent(control, FRAMEEVENT_MOUSE_DOWN);
    trigger.addAction(() => {
        game.players.get(MapPlayer.fromEvent()!.id)?.noteUiPress();
    });
}
