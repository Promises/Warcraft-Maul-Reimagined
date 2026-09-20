import {Frame, Trigger} from 'w3ts';
import * as settings from '../../GlobalSettings';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {trackHover} from './UiHover';
import {Util} from '../../../lib/translators';

const PANEL_CENTER_X = 0.4;
const PANEL_CENTER_Y = 0.40;
const PADDING = 0.012;
const TITLE_HEIGHT = 0.026;
const COLUMN_WIDTH = 0.16;
const COLUMN_GAP = 0.012;
const HEADER_HEIGHT = 0.022;
const ROW_HEIGHT = 0.028;
const ROW_SPACING = 0.032;
const BUTTON_WIDTH = 0.13;
const BUTTON_HEIGHT = 0.03;
const SELECTED_MARKER = '|cffffcc00>>|r';

/**
 * A column of mutually exclusive options. Rows are CustomTextButtons (the vote panel's
 * buttons, with a hit area that matches what is drawn); the selected row carries a marker
 * in its text, which reads on any background and needs no tinted frames.
 */
class OptionColumn {
    private readonly rows: Frame[] = [];
    private selected: number = 0;

    constructor(game: WarcraftMaul, name: string, parent: Frame, left: number, top: number,
                header: string, private readonly labels: string[]) {
        const title = Frame.createType(`${name}Header`, parent, 0, 'TEXT', '')!;
        title.setSize(COLUMN_WIDTH, HEADER_HEIGHT);
        title.setAbsPoint(FRAMEPOINT_TOPLEFT, left, top);
        title.setText(header);
        BlzFrameSetTextAlignment(title.handle, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER);

        labels.forEach((_, index) => {
            const button = Frame.create('CustomTextButton', parent, 0, 0)!;
            button.setSize(COLUMN_WIDTH, ROW_HEIGHT);
            button.setAbsPoint(FRAMEPOINT_TOPLEFT, left, top - HEADER_HEIGHT - index * ROW_SPACING);
            // The click fires on every client; the selection is the local player's view
            const trigger = Trigger.create();
            trigger.triggerRegisterFrameEvent(button, FRAMEEVENT_CONTROL_CLICK);
            trigger.addAction(() => {
                if (GetTriggerPlayer() !== GetLocalPlayer()) {
                    return;
                }
                button.setEnabled(false);
                button.setEnabled(true);
                this.select(index);
            });
            trackHover(game, button);
            this.rows.push(button);
        });
        this.select(0);
    }

    public select(index: number): void {
        this.selected = index;
        this.rows.forEach((row, i) => row.setText(i === index ? `${SELECTED_MARKER} ${this.labels[i]}` : this.labels[i]));
    }

    public get selection(): number {
        return this.selected;
    }
}

/**
 * The host's game settings: game mode and difficulty side by side, a Confirm button, and
 * the option to hand the decision to a player vote instead. Shown to the host only; the
 * choice is sent as a sync message so every client applies it.
 */
export class HostSettingsPanel {
    private readonly panel: Frame;
    private readonly modes: OptionColumn;
    private readonly difficulties: OptionColumn;

    constructor(game: WarcraftMaul,
                onConfirm: (this: void, mode: number, difficulty: number) => void,
                onVote: (this: void) => void) {
        const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
        const rows = Math.max(settings.GAME_MODE_STRINGS.length, settings.DIFFICULTIES.length);
        const width = PADDING + COLUMN_WIDTH + COLUMN_GAP + COLUMN_WIDTH + PADDING;
        const height = PADDING + TITLE_HEIGHT + PADDING + HEADER_HEIGHT + rows * ROW_SPACING + PADDING + BUTTON_HEIGHT + PADDING;
        const left = PANEL_CENTER_X - width / 2;
        const top = PANEL_CENTER_Y + height / 2;
        const bottom = PANEL_CENTER_Y - height / 2;

        this.panel = Frame.createType('hostSettingsPanel', gameUi, 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
        this.panel.setSize(width, height);
        this.panel.setAbsPoint(FRAMEPOINT_CENTER, PANEL_CENTER_X, PANEL_CENTER_Y);
        trackHover(game, this.panel);

        const title = Frame.createType('hostSettingsTitle', this.panel, 0, 'TEXT', '')!;
        title.setSize(width - 2 * PADDING, TITLE_HEIGHT);
        title.setAbsPoint(FRAMEPOINT_TOP, PANEL_CENTER_X, top - PADDING);
        title.setText('Game settings');
        BlzFrameSetTextAlignment(title.handle, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER);

        const columnsTop = top - PADDING - TITLE_HEIGHT - PADDING;
        this.modes = new OptionColumn(game, 'hostSettingsMode', this.panel, left + PADDING, columnsTop, 'Game mode',
            settings.GAME_MODE_STRINGS.map((mode, i) => Util.ColourString(settings.GAME_MODE_COLOURS[i], mode)));
        this.difficulties = new OptionColumn(game, 'hostSettingsDifficulty', this.panel,
            left + PADDING + COLUMN_WIDTH + COLUMN_GAP, columnsTop, 'Difficulty',
            settings.DIFFICULTIES.map((difficulty, i) =>
                Util.ColourString(settings.DIFFICULTY_COLOURS[i], `${difficulty}% ${settings.DIFFICULTY_STRINGS[i]}`)));

        // CustomTextButton comes from war3mapImported\ui\CustomTextButton.fdf. Both actions
        // are sent from the clicker's client only; the vote logic checks it is the host.
        this.addButton(game, 'hostSettingsVote', 'Let players vote', left + PADDING, bottom + PADDING,
            () => onVote());
        this.addButton(game, 'hostSettingsConfirm', 'Confirm', left + width - PADDING - BUTTON_WIDTH, bottom + PADDING,
            () => onConfirm(this.modes.selection, this.difficulties.selection));

        this.panel.setVisible(false);
    }

    private addButton(game: WarcraftMaul, name: string, text: string, left: number, bottom: number, action: () => void): void {
        const button = Frame.create('CustomTextButton', this.panel, 0, 0)!;
        button.setSize(BUTTON_WIDTH, BUTTON_HEIGHT);
        button.setAbsPoint(FRAMEPOINT_BOTTOMLEFT, left, bottom);
        button.setText(text);
        const trigger = Trigger.create();
        trigger.triggerRegisterFrameEvent(button, FRAMEEVENT_CONTROL_CLICK);
        trigger.addAction(() => {
            if (GetTriggerPlayer() !== GetLocalPlayer()) {
                return;
            }
            button.setEnabled(false);
            button.setEnabled(true);
            action();
        });
        trackHover(game, button);
    }

    /** Local UI: the panel appears on the given player's client only. */
    public show(player: Defender): void {
        if (player.isLocal()) {
            this.panel.setVisible(true);
        }
    }

    public hide(player: Defender): void {
        if (player.isLocal()) {
            this.panel.setVisible(false);
        }
    }
}
