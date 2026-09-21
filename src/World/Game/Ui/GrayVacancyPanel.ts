import {Frame, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';

// Above the command card at the right of the console. The UI is 0.6 tall with its width
// following the aspect ratio around x 0.4, so the right edge is computed for this client;
// frame positions are local and need no sync.
const CONSOLE_TOP_Y = 0.19;
const RIGHT_MARGIN = 0.02;
const PANEL_WIDTH = 0.20;
const PADDING = 0.008;
const TITLE_HEIGHT = 0.016;
const BODY_HEIGHT = 0.032;
const BUTTON_HEIGHT = 0.03;
const PANEL_HEIGHT = PADDING + TITLE_HEIGHT + PADDING / 2 + BODY_HEIGHT + PADDING / 2 + BUTTON_HEIGHT + PADDING;

/**
 * The notice that the gray lane is open after its holder left, with the button to take it.
 * Shown and hidden on every client alike (the vacancy is shared game state); the click is
 * gated to the clicker's own client, which sends the claim through PlayerSync so the first
 * claim to arrive wins on every client.
 */
export class GrayVacancyPanel {
    private readonly panel: Frame;

    constructor(game: WarcraftMaul, onClaim: (this: void) => void) {
        const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
        const aspect = BlzGetLocalClientWidth() / BlzGetLocalClientHeight();
        const right = 0.4 + 0.3 * aspect - RIGHT_MARGIN;
        const left = right - PANEL_WIDTH;
        const top = CONSOLE_TOP_Y + PANEL_HEIGHT;

        this.panel = Frame.createType('grayVacancyPanel', gameUi, 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
        this.panel.setSize(PANEL_WIDTH, PANEL_HEIGHT);
        this.panel.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, right, CONSOLE_TOP_Y);

        const title = Frame.createType('grayVacancyTitle', this.panel, 0, 'TEXT', '')!;
        title.setSize(PANEL_WIDTH - 2 * PADDING, TITLE_HEIGHT);
        title.setAbsPoint(FRAMEPOINT_TOP, left + PANEL_WIDTH / 2, top - PADDING);
        BlzFrameSetTextAlignment(title.handle, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER);
        title.setText('|cffffcc00Gray has left the game|r');

        const body = Frame.createType('grayVacancyBody', this.panel, 0, 'TEXT', '')!;
        body.setSize(PANEL_WIDTH - 2 * PADDING, BODY_HEIGHT);
        body.setAbsPoint(FRAMEPOINT_TOP, left + PANEL_WIDTH / 2, top - PADDING - TITLE_HEIGHT - PADDING / 2);
        BlzFrameSetTextAlignment(body.handle, TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_CENTER);
        body.setText('The last lane before the ship is open. Whoever takes it moves there with their towers.');

        const button = Frame.create('CustomTextButton', this.panel, 0, 0)!;
        button.setSize(PANEL_WIDTH - 2 * PADDING, BUTTON_HEIGHT);
        button.setAbsPoint(FRAMEPOINT_BOTTOM, left + PANEL_WIDTH / 2, CONSOLE_TOP_Y + PADDING);
        button.setText("I'll take Gray's place");
        const trigger = Trigger.create();
        trigger.triggerRegisterFrameEvent(button, FRAMEEVENT_CONTROL_CLICK);
        trigger.addAction(() => {
            if (GetTriggerPlayer() !== GetLocalPlayer()) {
                return;
            }
            button.setEnabled(false);
            button.setEnabled(true);
            onClaim();
        });

        this.panel.setVisible(false);
    }

    /** Shown on every client: the vacancy is the same for everyone. */
    public setVisible(visible: boolean): void {
        this.panel.setVisible(visible);
    }
}
