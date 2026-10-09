import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {createTextButton, onClick, onLocalClick, Tooltip, TooltipPlacement, uiRoot} from './Frames';
import {trackUiPress} from './UiPress';

/*
 * The recipe book as the Fusion Table (the design handoff's SPEC.md, direction B). Sizes and
 * offsets are in screen units, from the panel's top left corner to an element's top left (y
 * negative downwards).
 */
const PANEL_X = 0.030;
const PANEL_Y = 0.550;
const PANEL_WIDTH = 0.555;
const PANEL_HEIGHT = 0.335;

// The fusion table: Runes along the top and down the left, cell (i, j) for j >= i
const TABLE_PITCH = 0.033;
const RUNE_SIZE = 0.024;
const CELL_SIZE = 0.030;
const COLUMN_HEADER_X = 0.061;
const COLUMN_HEADER_Y = -0.054;
const ROW_HEADER_X = 0.026;
const ROW_HEADER_Y = -0.091;
const CELL_X = 0.058;
const CELL_Y = -0.088;

// The ledger: a row per Primal, with the Ascended it becomes
const ROW_Y = -0.083;
const ROW_PITCH = 0.0375;
const PRIMAL_SIZE = 0.034;
const ASCENDED_SIZE = 0.030;

const TOOLTIP_WIDTH = 0.22;

const WELL = 'uiImport\\CommandButtons\\frame-icon.dds';
const ARROW = 'uiImport\\RecipeBook\\arrow-right.dds';
/** The tier frames drawn over an entry's icon. */
export const TIER_FRAMES = {
    first: 'uiImport\\RecipeBook\\frame-first.dds',
    primal: 'uiImport\\RecipeBook\\frame-primal.dds',
    ascended: 'uiImport\\RecipeBook\\frame-ascended.dds',
};
/** What an entry shows in its icon's place while it is not in the book. */
export const SLOT_TEXTURES = {
    sealed: 'uiImport\\RecipeBook\\slot-sealed.dds',
    sealedReady: 'uiImport\\RecipeBook\\slot-sealed-ready.dds',
    empty: 'uiImport\\RecipeBook\\slot-empty.dds',
};
type Tier = keyof typeof TIER_FRAMES;

/** One entry's look and its tooltip. */
export interface SlotContent {
    icon: string;
    // The tier frame's alpha, 0 to 255 (dims an Ascended not yet made)
    tierAlpha?: number;
    // The "II" mark of a known Twin
    twin?: boolean;
    title: string;
    body: string;
}

export interface LedgerRow {
    primal: SlotContent;
    name: string;
    fee: string;
    line2: string;
    line3: string;
    arrowAlpha: number;
    ascended: SlotContent;
}

/** Everything the panel shows, with its colours, for the local player. */
export interface BookView {
    tally: string;
    runes: SlotContent[];
    // Row by row, j >= i: (0, 0), (0, 1) ... (0, 5), (1, 1) ... (5, 5)
    cells: SlotContent[];
    count: string;
    revealLine1: string;
    revealLine2: string;
    ledgerTitle: string;
    ledgerSubline: string;
    ascendedHeader: string;
    rows: LedgerRow[];
}

/** A frame's top left corner at an offset from the panel's, and its size. */
function place(frame: Frame, panel: Frame, x: number, y: number, width: number, height: number = width): void {
    frame.setPoint(FRAMEPOINT_TOPLEFT, panel, FRAMEPOINT_TOPLEFT, x, y);
    frame.setSize(width, height);
}

/**
 * A text of a given font size, from its RecipeBookText template (war3mapImported\ui\CustomTextButton.fdf:
 * a TEXT made without a font keeps the default size whatever BlzFrameSetFont is given). Disabled,
 * as every label is (Frames).
 */
function sizedText(name: string, parent: Frame, size: number, vertical: textaligntype, horizontal: textaligntype): Frame {
    const template = `RecipeBookText${string.format('%04d', math.floor(size * 10000 + 0.5))}`;
    const text = Frame.createType(name, parent, 0, 'TEXT', template)!;
    text.enabled = false;
    BlzFrameSetTextAlignment(text.handle, vertical, horizontal);
    return text;
}

function label(name: string, panel: Frame, x: number, y: number, width: number, height: number, size: number,
               vertical: textaligntype = TEXT_JUSTIFY_TOP, horizontal: textaligntype = TEXT_JUSTIFY_LEFT): Frame {
    const text = sizedText(name, panel, size, vertical, horizontal);
    place(text, panel, x, y, width, height);
    return text;
}

/**
 * An entry: its icon inset in a tier frame (or, for a Rune, in the action bar's well), a
 * CustomIconButton over both for the hover glow, the tooltip and the click. Each layer is the
 * previous one's child, so it draws over it.
 */
class BookSlot {
    private readonly icon: Frame;
    private readonly tier: Frame | undefined;
    private readonly twin: Frame | undefined;
    private readonly tooltip: Tooltip;

    constructor(game: WarcraftMaul, name: string, panel: Frame, x: number, y: number, size: number, tier: Tier | undefined,
                placement: TooltipPlacement, handler?: (this: void, player: Defender) => void) {
        let parent = panel;
        let inset = size * 16 / 128;
        if (tier === undefined) {
            const well = Frame.createType(`${name}Well`, panel, 0, 'BACKDROP', '')!;
            place(well, panel, x, y, size);
            well.setTexture(WELL, 0, true);
            parent = well;
            inset = size * 11 / 96;
        }
        this.icon = Frame.createType(`${name}Icon`, parent, 0, 'BACKDROP', '')!;
        place(this.icon, panel, x + inset, y - inset, size - 2 * inset);

        let top = this.icon;
        if (tier !== undefined) {
            this.tier = Frame.createType(`${name}Tier`, this.icon, 0, 'BACKDROP', '')!;
            place(this.tier, panel, x, y, size);
            this.tier.setTexture(TIER_FRAMES[tier], 0, true);
            top = this.tier;
        }
        const button = Frame.createType(name, top, 0, 'BUTTON', 'CustomIconButton')!;
        place(button, panel, x, y, size);

        if (tier === 'first') {
            this.twin = sizedText(`${name}Twin`, button, 0.0085, TEXT_JUSTIFY_BOTTOM, TEXT_JUSTIFY_RIGHT);
            this.twin.setText('II');
            this.twin.setPoint(FRAMEPOINT_BOTTOMRIGHT, button, FRAMEPOINT_BOTTOMRIGHT, -size * 0.17, size * 0.15);
            this.twin.setSize(size * 0.5, size * 0.4);
            this.twin.setVisible(false);
        }
        this.tooltip = new Tooltip(name, button, TOOLTIP_WIDTH, button, placement);
        if (handler !== undefined) {
            onClick(button, clicker => {
                const player = game.players.get(clicker.id);
                if (player) {
                    handler(player);
                }
            });
        }
        trackUiPress(game, button);
    }

    /** Local. */
    public show(content: SlotContent): void {
        this.icon.setTexture(content.icon, 0, true);
        this.tier?.setAlpha(content.tierAlpha ?? 255);
        this.twin?.setVisible(content.twin === true);
        this.tooltip.setText(content.title, content.body);
    }
}

/**
 * The Elementalist's recipe book: the six Runes against each other, a cell for each of the 21
 * first fusions, and a ledger of the six Primals with the Ascended each becomes. A view of the
 * local player's own book: RecipeBook fills it (show) for that player only, and whether it is
 * open is local. The frames exist on every client alike; a click on a Primal is a synced event,
 * and RecipeBook decides what it does (onPrimal, run on every client with the clicker).
 */
export class RecipeBookPanel {
    private readonly panel: Frame;
    private readonly tally: Frame;
    private readonly runeColumns: BookSlot[] = [];
    private readonly runeRows: BookSlot[] = [];
    private readonly cells: BookSlot[] = [];
    private readonly count: Frame;
    private readonly revealLine1: Frame;
    private readonly revealLine2: Frame;
    private readonly ledgerTitle: Frame;
    private readonly ledgerSubline: Frame;
    private readonly ascendedHeader: Frame;
    private readonly rows: {primal: BookSlot, name: Frame, fee: Frame, line2: Frame, line3: Frame, arrow: Frame,
        ascended: BookSlot}[] = [];

    constructor(game: WarcraftMaul, onPrimal: (this: void, player: Defender, row: number) => void) {
        this.panel = Frame.createType('recipeBookPanel', uiRoot(), 0, 'BACKDROP', 'RecipeBookBackdrop')!;
        this.panel.setAbsPoint(FRAMEPOINT_TOPLEFT, PANEL_X, PANEL_Y);
        this.panel.setSize(PANEL_WIDTH, PANEL_HEIGHT);
        this.panel.setVisible(false);

        const title = label('recipeBookTitle', this.panel, 0.025, -0.018, 0.120, 0.020, 0.015, TEXT_JUSTIFY_MIDDLE);
        title.setText('|cfffcd312Recipe Book|r');
        this.tally = label('recipeBookTally', this.panel, 0.130, -0.020, 0.120, 0.020, 0.011, TEXT_JUSTIFY_MIDDLE);
        const close = createTextButton(this.panel, 'Close', 0.062, 0.024);
        place(close, this.panel, 0.473, -0.016, 0.062, 0.024);
        onLocalClick(close, () => this.panel.setVisible(false));

        // The table
        const table = Frame.createType('recipeBookTable', this.panel, 0, 'BACKDROP', 'EscMenuControlBackdropTemplate')!;
        place(table, this.panel, 0.018, -0.045, 0.262, 0.270);
        for (let i = 0; i < 6; i++) {
            this.runeColumns.push(new BookSlot(game, `recipeBookColumn${i}`, this.panel, COLUMN_HEADER_X + TABLE_PITCH * i,
                COLUMN_HEADER_Y, RUNE_SIZE, undefined, 'belowRight'));
            this.runeRows.push(new BookSlot(game, `recipeBookRow${i}`, this.panel, ROW_HEADER_X,
                ROW_HEADER_Y - TABLE_PITCH * i, RUNE_SIZE, undefined, i < 3 ? 'belowRight' : 'aboveRight'));
        }
        for (let i = 0; i < 6; i++) {
            for (let j = i; j < 6; j++) {
                const index = this.cells.length;
                this.cells.push(new BookSlot(game, `recipeBookCell${index}`, this.panel, CELL_X + TABLE_PITCH * j,
                    CELL_Y - TABLE_PITCH * i, CELL_SIZE, 'first', i < 3 ? 'belowRight' : 'aboveRight'));
            }
        }
        const caption = label('recipeBookCaption', this.panel, 0.058, -0.191, 0.100, 0.016, 0.0115);
        caption.setText('|cfffcd312First fusions|r');
        const captionLine = label('recipeBookCaptionLine', this.panel, 0.058, -0.206, 0.100, 0.014, 0.0092);
        captionLine.setText('|cffa0a0a0two Runes, free|r');
        this.count = label('recipeBookCount', this.panel, 0.058, -0.221, 0.100, 0.020, 0.014);
        this.revealLine1 = label('recipeBookReveal1', this.panel, 0.058, -0.245, 0.100, 0.014, 0.0098);
        this.revealLine2 = label('recipeBookReveal2', this.panel, 0.058, -0.258, 0.100, 0.024, 0.0085);

        // The ledger
        const ledger = Frame.createType('recipeBookLedger', this.panel, 0, 'BACKDROP', 'EscMenuControlBackdropTemplate')!;
        place(ledger, this.panel, 0.288, -0.045, 0.252, 0.270);
        this.ledgerTitle = label('recipeBookLedgerTitle', this.panel, 0.298, -0.053, 0.140, 0.016, 0.0115);
        this.ledgerSubline = label('recipeBookLedgerSubline', this.panel, 0.298, -0.068, 0.170, 0.013, 0.0088);
        this.ascendedHeader = label('recipeBookAscendedHeader', this.panel, 0.456, -0.053, 0.075, 0.030, 0.0088,
            TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_RIGHT);
        for (let r = 0; r < 6; r++) {
            // Its own variable: a TSTL for-loop's closures share the loop variable
            const row = r;
            const y = ROW_Y - ROW_PITCH * r;
            const placement: TooltipPlacement = r < 3 ? 'belowLeft' : 'aboveLeft';
            const arrow = Frame.createType(`recipeBookArrow${r}`, this.panel, 0, 'BACKDROP', '')!;
            place(arrow, this.panel, 0.484, y - 0.011, 0.012);
            arrow.setTexture(ARROW, 0, true);
            this.rows.push({
                primal: new BookSlot(game, `recipeBookPrimal${r}`, this.panel, 0.296, y, PRIMAL_SIZE, 'primal', placement,
                    player => onPrimal(player, row)),
                name: label(`recipeBookName${r}`, this.panel, 0.336, y + 0.001, 0.100, 0.014, 0.011),
                fee: label(`recipeBookFee${r}`, this.panel, 0.406, y + 0.001, 0.072, 0.014, 0.0088,
                    TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_RIGHT),
                line2: label(`recipeBookLine2_${r}`, this.panel, 0.336, y - 0.0125, 0.150, 0.012, 0.0085),
                line3: label(`recipeBookLine3_${r}`, this.panel, 0.336, y - 0.0235, 0.150, 0.012, 0.0085),
                arrow,
                ascended: new BookSlot(game, `recipeBookAscended${r}`, this.panel, 0.500, y - 0.002, ASCENDED_SIZE,
                    'ascended', placement),
            });
        }
    }

    /** Local: the local player's book. */
    public show(view: BookView): void {
        this.tally.setText(view.tally);
        view.runes.forEach((rune, i) => {
            this.runeColumns[i].show(rune);
            this.runeRows[i].show(rune);
        });
        view.cells.forEach((cell, i) => this.cells[i].show(cell));
        this.count.setText(view.count);
        this.revealLine1.setText(view.revealLine1);
        this.revealLine2.setText(view.revealLine2);
        this.ledgerTitle.setText(view.ledgerTitle);
        this.ledgerSubline.setText(view.ledgerSubline);
        this.ascendedHeader.setText(view.ascendedHeader);
        view.rows.forEach((row, r) => {
            const frames = this.rows[r];
            frames.primal.show(row.primal);
            frames.name.setText(row.name);
            frames.fee.setText(row.fee);
            frames.line2.setText(row.line2);
            frames.line3.setText(row.line3);
            frames.arrow.setAlpha(row.arrowAlpha);
            frames.ascended.show(row.ascended);
        });
    }

    /** Local. */
    public toggle(): void {
        this.panel.setVisible(!this.panel.visible);
    }
}
