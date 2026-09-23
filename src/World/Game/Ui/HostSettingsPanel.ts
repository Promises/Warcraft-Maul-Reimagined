import {Frame} from 'w3ts';
import * as settings from '../../GlobalSettings';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {Util} from '../../../lib/translators';
import {createBackdrop, createPanel, createText, createTextButton, onLocalClick} from './Frames';

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
const RADIO_SIZE = 0.016;
const RADIO_INSET = 0.006;
const LABEL_GAP = 0.006;
// The ESC menu's radio art (see war3skins.txt EscMenuRadioButton*)
const RADIO_RING = 'UI\\Widgets\\EscMenu\\Human\\radiobutton-background.blp';
const RADIO_DOT = 'UI\\Widgets\\EscMenu\\Human\\radiobutton-button.blp';

/**
 * A column of mutually exclusive options drawn as radio buttons. The game's GLUECHECKBOX
 * toggles itself and its checked state cannot be set reliably from script, so each row is the
 * ESC-menu radio art (war3skins: radiobutton-background, and radiobutton-button as the dot)
 * and a label, with one plain button over the whole row taking the click; the column shows
 * the dot on exactly one row.
 */
class OptionColumn {
    private readonly dots: Frame[] = [];
    private selected: number = 0;

    /** Placed with its top-left at (left, top) from the parent's top-left. */
    constructor(name: string, parent: Frame, left: number, top: number, header: string, labels: string[]) {
        const title = createText(`${name}Header`, parent, header);
        title.setSize(COLUMN_WIDTH, HEADER_HEIGHT);
        title.setPoint(FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_TOPLEFT, left, top);

        labels.forEach((label, index) => {
            const row = Frame.createType(`${name}Row${index}`, parent, 0, 'FRAME', '')!;
            row.setSize(COLUMN_WIDTH, ROW_HEIGHT);
            row.setPoint(FRAMEPOINT_TOPLEFT, title, FRAMEPOINT_BOTTOMLEFT, 0, -index * ROW_SPACING);

            const ring = createBackdrop(`${name}Row${index}Ring`, row, RADIO_RING);
            ring.setSize(RADIO_SIZE, RADIO_SIZE);
            ring.setPoint(FRAMEPOINT_LEFT, row, FRAMEPOINT_LEFT, RADIO_INSET, 0);
            const dot = createBackdrop(`${name}Row${index}Dot`, ring, RADIO_DOT);
            dot.setAllPoints(ring);

            const text = createText(`${name}Row${index}Label`, row, label, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            text.setPoint(FRAMEPOINT_LEFT, ring, FRAMEPOINT_RIGHT, LABEL_GAP, 0);
            text.setSize(COLUMN_WIDTH - RADIO_INSET - RADIO_SIZE - LABEL_GAP, ROW_HEIGHT);

            // Created last, so it lies over the radio and the label
            const button = Frame.createType(`${name}Row${index}Button`, row, 0, 'BUTTON', '')!;
            button.setAllPoints(row);
            // The selection is the local view
            onLocalClick(button, () => this.select(index));
            this.dots.push(dot);
        });
        this.select(0);
    }

    public select(index: number): void {
        this.selected = index;
        this.dots.forEach((dot, i) => dot.setVisible(i === index));
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
        const rows = Math.max(settings.GAME_MODE_STRINGS.length, settings.DIFFICULTIES.length);
        const width = PADDING + COLUMN_WIDTH + COLUMN_GAP + COLUMN_WIDTH + PADDING;
        const height = PADDING + TITLE_HEIGHT + PADDING + HEADER_HEIGHT + rows * ROW_SPACING + PADDING + BUTTON_HEIGHT + PADDING;

        this.panel = createPanel('hostSettingsPanel', width, height);
        this.panel.setAbsPoint(FRAMEPOINT_CENTER, PANEL_CENTER_X, PANEL_CENTER_Y);

        const title = createText('hostSettingsTitle', this.panel, 'Game settings');
        title.setSize(width - 2 * PADDING, TITLE_HEIGHT);
        title.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, -PADDING);

        const columnsTop = -PADDING - TITLE_HEIGHT - PADDING;
        this.modes = new OptionColumn('hostSettingsMode', this.panel, PADDING, columnsTop, 'Game mode',
            settings.GAME_MODE_STRINGS.map((mode, i) => Util.ColourString(settings.GAME_MODE_COLOURS[i], mode)));
        this.difficulties = new OptionColumn('hostSettingsDifficulty', this.panel,
            PADDING + COLUMN_WIDTH + COLUMN_GAP, columnsTop, 'Difficulty',
            settings.DIFFICULTIES.map((difficulty, i) =>
                Util.ColourString(settings.DIFFICULTY_COLOURS[i], `${difficulty}% ${settings.DIFFICULTY_STRINGS[i]}`)));

        // Both actions are sent from the clicker's client only; the vote logic checks it is the host
        const vote = createTextButton(this.panel, 'Let players vote', BUTTON_WIDTH, BUTTON_HEIGHT);
        vote.setPoint(FRAMEPOINT_BOTTOMLEFT, this.panel, FRAMEPOINT_BOTTOMLEFT, PADDING, PADDING);
        onLocalClick(vote, () => onVote());
        const confirm = createTextButton(this.panel, 'Confirm', BUTTON_WIDTH, BUTTON_HEIGHT);
        confirm.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.panel, FRAMEPOINT_BOTTOMRIGHT, -PADDING, PADDING);
        onLocalClick(confirm, () => onConfirm(this.modes.selection, this.difficulties.selection));
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
