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
const RADIO_SIZE = 0.016;
const RADIO_INSET = 0.006;
const LABEL_GAP = 0.006;

/**
 * A column of mutually exclusive options with the game's own radio buttons
 * (EscMenuRadioButtonTemplate, a GLUECHECKBOX with the round ESC-menu art; the template is
 * loaded because our TOC includes EscMenuTemplates.fdf). A checkbox toggles itself on click,
 * so the column keeps exactly one checked: checking one unchecks the rest, and unchecking the
 * selected one is undone. The label next to each radio is an invisible button, so clicking
 * the text selects too.
 */
class OptionColumn {
    private readonly radios: Frame[] = [];
    private selected: number = 0;
    // Set while the column changes states itself, so the resulting events are ignored
    private updating: boolean = false;

    constructor(game: WarcraftMaul, name: string, parent: Frame, left: number, top: number,
                header: string, labels: string[]) {
        const title = Frame.createType(`${name}Header`, parent, 0, 'TEXT', '')!;
        title.setSize(COLUMN_WIDTH, HEADER_HEIGHT);
        title.setAbsPoint(FRAMEPOINT_TOPLEFT, left, top);
        title.setText(header);
        BlzFrameSetTextAlignment(title.handle, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER);

        labels.forEach((label, index) => {
            const rowTop = top - HEADER_HEIGHT - index * ROW_SPACING;
            const radio = Frame.create('EscMenuRadioButtonTemplate', parent, 0, 0)!;
            radio.setSize(RADIO_SIZE, RADIO_SIZE);
            radio.setAbsPoint(FRAMEPOINT_LEFT, left + RADIO_INSET, rowTop - ROW_HEIGHT / 2);

            const text = Frame.createType(`${name}Row${index}Label`, parent, 0, 'TEXT', '')!;
            text.setSize(COLUMN_WIDTH - RADIO_INSET - RADIO_SIZE - LABEL_GAP, ROW_HEIGHT);
            text.setAbsPoint(FRAMEPOINT_LEFT, left + RADIO_INSET + RADIO_SIZE + LABEL_GAP, rowTop - ROW_HEIGHT / 2);
            text.setText(label);
            BlzFrameSetTextAlignment(text.handle, TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);

            // Invisible click target over the label
            const labelButton = Frame.createType(`${name}Row${index}Hit`, parent, 0, 'BUTTON', '')!;
            labelButton.setAllPoints(text);

            // Events fire on every client with the acting player; the selection is the local view
            const clicks = Trigger.create();
            clicks.triggerRegisterFrameEvent(radio, FRAMEEVENT_CHECKBOX_CHECKED);
            clicks.triggerRegisterFrameEvent(radio, FRAMEEVENT_CHECKBOX_UNCHECKED);
            clicks.addAction(() => {
                if (this.updating || GetTriggerPlayer() !== GetLocalPlayer()) {
                    return;
                }
                if (Frame.getEventHandle() === FRAMEEVENT_CHECKBOX_CHECKED) {
                    this.select(index);
                } else if (index === this.selected) {
                    // The selected radio cannot be unchecked, only replaced
                    this.setChecked(radio, true);
                }
            });
            const labelClick = Trigger.create();
            labelClick.triggerRegisterFrameEvent(labelButton, FRAMEEVENT_CONTROL_CLICK);
            labelClick.addAction(() => {
                if (GetTriggerPlayer() !== GetLocalPlayer()) {
                    return;
                }
                labelButton.setEnabled(false);
                labelButton.setEnabled(true);
                this.select(index);
            });
            trackHover(game, radio);
            trackHover(game, labelButton);
            this.radios.push(radio);
        });
        this.select(0);
    }

    public select(index: number): void {
        this.selected = index;
        this.radios.forEach((radio, i) => this.setChecked(radio, i === index));
    }

    private setChecked(radio: Frame, checked: boolean): void {
        this.updating = true;
        if ((radio.value > 0) !== checked) {
            radio.setValue(checked ? 1 : 0);
            if ((radio.value > 0) !== checked) {
                // Some builds only flip a checkbox through a click
                radio.click();
            }
        }
        this.updating = false;
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
