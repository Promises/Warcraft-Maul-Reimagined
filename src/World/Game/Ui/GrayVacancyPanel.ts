import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {createPanel, createText, createTextButton, onLocalClick} from './Frames';

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
        const aspect = BlzGetLocalClientWidth() / BlzGetLocalClientHeight();
        const right = 0.4 + 0.3 * aspect - RIGHT_MARGIN;

        this.panel = createPanel('grayVacancyPanel', PANEL_WIDTH, PANEL_HEIGHT);
        this.panel.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, right, CONSOLE_TOP_Y);

        const title = createText('grayVacancyTitle', this.panel, '|cffffcc00Gray has left the game|r');
        title.setSize(PANEL_WIDTH - 2 * PADDING, TITLE_HEIGHT);
        title.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, -PADDING);

        const body = createText('grayVacancyBody', this.panel,
            'The last lane before the ship is open. Whoever takes it moves there with their towers.',
            TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_CENTER);
        body.setSize(PANEL_WIDTH - 2 * PADDING, BODY_HEIGHT);
        body.setPoint(FRAMEPOINT_TOP, title, FRAMEPOINT_BOTTOM, 0, -PADDING / 2);

        const button = createTextButton(this.panel, "I'll take Gray's place", PANEL_WIDTH - 2 * PADDING, BUTTON_HEIGHT);
        button.setPoint(FRAMEPOINT_BOTTOM, this.panel, FRAMEPOINT_BOTTOM, 0, PADDING);
        onLocalClick(button, () => onClaim());
    }

    /** Shown on every client: the vacancy is the same for everyone. */
    public setVisible(visible: boolean): void {
        this.panel.setVisible(visible);
    }
}
