import {Frame, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {trackHover} from './UiHover';

// Left side of the screen, clear of the centred race panel, so votes never cover it
const PANEL_LEFT = 0.06;
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
 * A button click is a local frame event, so it only calls onVote; the caller sends a sync
 * message so the tally is applied on every client.
 */
export class VotePanel {
    private readonly panel: Frame;
    private readonly title: Frame;
    private readonly options: Frame[] = [];
    private onVote: (this: void, index: number) => void = () => undefined;
    private optionCount: number = 0;

    constructor(game: WarcraftMaul) {
        const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
        const height = PADDING + TITLE_HEIGHT + PADDING + MAX_OPTIONS * OPTION_SPACING + PADDING;
        const top = PANEL_CENTER_Y + height / 2;

        this.panel = Frame.createType('votePanel', gameUi, 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
        this.panel.setSize(PANEL_WIDTH, height);
        this.panel.setAbsPoint(FRAMEPOINT_TOPLEFT, PANEL_LEFT, top);
        trackHover(game, this.panel);

        this.title = Frame.createType('votePanelTitle', this.panel, 0, 'TEXT', '')!;
        this.title.setSize(PANEL_WIDTH - 2 * PADDING, TITLE_HEIGHT);
        this.title.setAbsPoint(FRAMEPOINT_TOP, PANEL_LEFT + PANEL_WIDTH / 2, top - PADDING);
        BlzFrameSetTextAlignment(this.title.handle, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER);

        for (const index of Array.from({length: MAX_OPTIONS}, (_, i) => i)) {
            const button = Frame.create('CustomTextButton', this.panel, 0, 0)!;
            button.setSize(PANEL_WIDTH - 2 * PADDING, OPTION_HEIGHT);
            button.setAbsPoint(FRAMEPOINT_TOP, PANEL_LEFT + PANEL_WIDTH / 2,
                top - PADDING - TITLE_HEIGHT - PADDING - index * OPTION_SPACING);
            const trigger = Trigger.create();
            trigger.triggerRegisterFrameEvent(button, FRAMEEVENT_CONTROL_CLICK);
            trigger.addAction(() => {
                button.setEnabled(false);
                button.setEnabled(true);
                if (index < this.optionCount) {
                    // Hide immediately for responsiveness; the tally is applied when the sync arrives
                    this.panel.setVisible(false);
                    this.onVote(index);
                }
            });
            trackHover(game, button);
            this.options.push(button);
        }

        this.panel.setVisible(false);
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
