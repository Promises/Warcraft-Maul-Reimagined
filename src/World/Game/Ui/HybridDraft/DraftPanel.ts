import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../../Entity/Players/Defender';
import {IconButton} from '../IconButton';
import {createText, createTextButton, onClick, TooltipPlacement, uiRoot} from '../Frames';

/*
 * A generic "pick one of N per row" draft, used for hybrid random (9 tiers, 2 options each) and
 * meant to be reused for the planned rogue mode. The current build is previewed as a grid in the
 * middle; the options sit to the side, one row per tier. It is view-driven (DraftView) with select
 * and confirm callbacks, so the hybrid specifics live in RacePicking, not here.
 *
 * Desync note: the frames exist on every client, but which draft the panel shows is the LOCAL
 * player's, set only for them (show/hide/rerender are all local). The buttons' clicks are synced
 * player events, so select/confirm run on every client with the acting player; the caller keeps the
 * draft state in step there and only the local view re-renders.
 */
// Top-anchored below the HUD and grown downward, sized to stop clear of the command card at the
// bottom - nine option rows plus a confirm have to fit between the two.
const PANEL_WIDTH = 0.38;
const PANEL_HEIGHT = 0.335;
const PANEL_TOP_X = 0.4;
const PANEL_TOP_Y = 0.55;

const TITLE_Y = -0.016;
const SECTION_Y = -0.044;

// The "Your build" preview: a grid, column count fixed so 9 tiers read as the 3x3 command card
const PREVIEW_COLUMNS = 3;
const PREVIEW_X = 0.045;
const PREVIEW_Y = -0.072;
const PREVIEW_SIZE = 0.036;
const PREVIEW_PITCH = 0.044;

// The option rows: one per tier down the right, each with its option slots
const OPTIONS_X = 0.210;
const OPTIONS_Y = -0.064;
const ROW_PITCH = 0.025;
const ROW_LABEL_WIDTH = 0.034;
const OPTION_SIZE = 0.024;
const OPTION_PITCH = 0.038;

const CONFIRM_WIDTH = 0.12;
const CONFIRM_HEIGHT = 0.028;

/** One option's icon and tooltip. */
export interface DraftOption {
    icon: string;
    title: string;
    body: string;
    goldCost?: number;
}

/** One row of the draft: a label, its options, and which one is currently chosen. */
export interface DraftRow {
    label: string;
    options: DraftOption[];
    chosen: number;
}

/** Everything the panel shows for the local player. */
export interface DraftView {
    title: string;
    previewHeader: string;
    optionsHeader: string;
    confirm: string;
    rows: DraftRow[];
}

export class DraftPanel {
    private readonly panel: Frame;
    private readonly title: Frame;
    private readonly previewHeader: Frame;
    private readonly optionsHeader: Frame;
    private readonly previewSlots: IconButton[] = [];
    private readonly rowLabels: Frame[] = [];
    private readonly optionSlots: IconButton[][] = [];
    private readonly confirm: Frame;

    constructor(game: WarcraftMaul, maxRows: number, optionsPerRow: number,
                onSelect: (this: void, player: Defender, row: number, option: number) => void,
                onConfirm: (this: void, player: Defender) => void) {
        // Opaque ESC-menu panel, centred on the screen (createPanel's template is see-through).
        this.panel = Frame.createType('draftPanel', uiRoot(), 0, 'BACKDROP', 'EscMenuBackdrop')!;
        this.panel.setSize(PANEL_WIDTH, PANEL_HEIGHT);
        this.panel.setAbsPoint(FRAMEPOINT_TOP, PANEL_TOP_X, PANEL_TOP_Y);
        this.panel.setVisible(false);

        this.title = createText('draftTitle', this.panel, '', TEXT_JUSTIFY_MIDDLE);
        this.title.setSize(PANEL_WIDTH, 0.022);
        this.title.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, TITLE_Y);

        this.previewHeader = sectionLabel('draftPreviewHeader', this.panel, PREVIEW_X);
        this.optionsHeader = sectionLabel('draftOptionsHeader', this.panel, OPTIONS_X);

        // Preview grid: one slot per row (tier), numbered so it maps to the option rows.
        for (let r = 0; r < maxRows; r++) {
            const row = r;
            // The panel sits high on the screen, so a top-row tooltip opening upward goes off-view;
            // open it downward for the upper rows and upward for the lower ones, always toward centre.
            const placement: TooltipPlacement = Math.floor(row / PREVIEW_COLUMNS) === 0 ? 'belowRight' : 'aboveRight';
            const slot = new IconButton(game, `draftPreview${row}`, this.panel, PREVIEW_SIZE,
                () => { /* preview is read-only */ }, true, placement);
            slot.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT,
                PREVIEW_X + (row % PREVIEW_COLUMNS) * PREVIEW_PITCH,
                PREVIEW_Y - Math.floor(row / PREVIEW_COLUMNS) * PREVIEW_PITCH);
            slot.setHotkey(`${row + 1}`);
            this.previewSlots.push(slot);
        }

        // Option rows down the side: a label and the options for each tier.
        for (let r = 0; r < maxRows; r++) {
            const row = r;
            const y = OPTIONS_Y - row * ROW_PITCH;
            const rowLabel = createText(`draftRowLabel${row}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            rowLabel.setSize(ROW_LABEL_WIDTH, OPTION_SIZE);
            rowLabel.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, OPTIONS_X, y);
            this.rowLabels.push(rowLabel);

            const slots: IconButton[] = [];
            // Upper rows open their tooltip downward, lower rows upward, so none runs off the screen.
            const placement: TooltipPlacement = row < maxRows / 2 ? 'belowRight' : 'aboveRight';
            for (let o = 0; o < optionsPerRow; o++) {
                const option = o;
                const optionX = OPTIONS_X + ROW_LABEL_WIDTH + option * OPTION_PITCH;
                const slot = new IconButton(game, `draftRow${row}Option${option}`, this.panel, OPTION_SIZE,
                    player => onSelect(player, row, option), true, placement);
                slot.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, optionX, y);
                slots.push(slot);
            }
            this.optionSlots.push(slots);
        }

        this.confirm = createTextButton(this.panel, 'Confirm', CONFIRM_WIDTH, CONFIRM_HEIGHT);
        this.confirm.setPoint(FRAMEPOINT_BOTTOM, this.panel, FRAMEPOINT_BOTTOM, 0, 0.014);
        // Confirm must run on every client (it creates the builder and broadcasts the build), so it
        // uses the synced click like the option slots; onConfirm gates on the shared draft state.
        onClick(this.confirm, clicker => {
            const player = game.players.get(clicker.id);
            if (player !== undefined) {
                onConfirm(player);
            }
        });
    }

    /** Local: shows (or re-renders) the draft for one player. */
    public show(player: Defender, view: DraftView): void {
        if (!player.isLocal()) {
            return;
        }
        this.title.setText(view.title);
        this.previewHeader.setText(view.previewHeader);
        this.optionsHeader.setText(view.optionsHeader);
        this.confirm.setText(view.confirm);
        view.rows.forEach((row, r) => {
            const chosen: DraftOption | undefined = row.options[row.chosen];
            if (chosen !== undefined) {
                this.previewSlots[r].setContent(player, toContent(chosen));
            }
            this.rowLabels[r].setText(row.label);
            this.optionSlots[r].forEach((slot, o) => {
                const option: DraftOption | undefined = row.options[o];
                if (option !== undefined) {
                    slot.setContent(player, toContent(option));
                    // The chosen option is lit; the rest are dimmed - the selected state.
                    slot.setDimmed(player, o !== row.chosen);
                }
            });
        });
        this.panel.setVisible(true);
    }

    /** Local: hides the draft for one player (on confirm). */
    public hide(player: Defender): void {
        if (!player.isLocal()) {
            return;
        }
        this.panel.setVisible(false);
    }
}

function sectionLabel(name: string, panel: Frame, x: number): Frame {
    const text = createText(name, panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
    text.setSize(0.17, 0.018);
    text.setPoint(FRAMEPOINT_TOPLEFT, panel, FRAMEPOINT_TOPLEFT, x, SECTION_Y);
    return text;
}

function toContent(option: DraftOption): {icon: string, title: string, description: string, goldCost?: number} {
    return {icon: option.icon, title: option.title, description: option.body, goldCost: option.goldCost};
}
