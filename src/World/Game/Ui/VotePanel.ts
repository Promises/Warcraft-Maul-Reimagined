import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {createPanel, createText, createTextButton, onLocalClick} from './Frames';

// Flush with the left screen edge: the centred race panel starts at x 0.142, and the two are shown together
const PANEL_LEFT = 0.00;
const PANEL_CENTER_Y = 0.40;
const PANEL_WIDTH = 0.14;
const PADDING = 0.01;
const TITLE_HEIGHT = 0.024;
const OPTION_HEIGHT = 0.03;
const OPTION_SPACING = 0.034;
const MAX_OPTIONS = 6;

/**
 * Left-side voting panel that replaces the native mode/difficulty vote dialogs. Native dialogs
 * are modal and cover the race panel; this is an ordinary frame panel, so all three coexist.
 * A button click fires on every client with the clicking player, so the handler is gated to
 * the clicker's own client: it hides that client's panel and calls onVote once, and the
 * caller's sync message applies the tally on every client.
 */
export class VotePanel {
    private readonly panel: Frame;
    private readonly title: Frame;
    private readonly options: Frame[] = [];
    private onVote: (this: void, index: number) => void = () => undefined;
    private optionCount: number = 0;

    constructor(game: WarcraftMaul) {
        const height = PADDING + TITLE_HEIGHT + PADDING + MAX_OPTIONS * OPTION_SPACING + PADDING;

        this.panel = createPanel('votePanel', PANEL_WIDTH, height);
        this.panel.setAbsPoint(FRAMEPOINT_TOPLEFT, PANEL_LEFT, PANEL_CENTER_Y + height / 2);

        this.title = createText('votePanelTitle', this.panel);
        this.title.setSize(PANEL_WIDTH - 2 * PADDING, TITLE_HEIGHT);
        this.title.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, -PADDING);

        for (const index of Array.from({length: MAX_OPTIONS}, (_, i) => i)) {
            const button = createTextButton(this.panel, '', PANEL_WIDTH - 2 * PADDING, OPTION_HEIGHT);
            button.setPoint(FRAMEPOINT_TOP, this.title, FRAMEPOINT_BOTTOM, 0, -PADDING - index * OPTION_SPACING);
            onLocalClick(button, () => {
                if (index < this.optionCount) {
                    // Hide immediately for responsiveness; the tally is applied when the sync arrives
                    this.panel.setVisible(false);
                    this.onVote(index);
                }
            });
            this.options.push(button);
        }
    }

    /** Shows the panel with a title and options, and the callback for a click (local UI). */
    public show(title: string, optionLabels: string[], onVote: (this: void, index: number) => void): void {
        this.onVote = onVote;
        this.optionCount = optionLabels.length;
        this.title.setText(title);
        this.options.forEach((button, index) => {
            const visible = index < optionLabels.length;
            button.setVisible(visible);
            if (visible) {
                button.setText(optionLabels[index]);
                button.setEnabled(true);
            }
        });
        this.panel.setVisible(true);
    }

    public hide(player: Defender): void {
        if (player.isLocal()) {
            this.panel.setVisible(false);
        }
    }
}
