import {Frame} from 'w3ts';
import {createPanel, createText, createTextButton, onLocalClick} from './Frames';

// Centred over the play area, below the top bar; the panel grows down with its contents
const TOP_Y = 0.54;
const PANEL_WIDTH = 0.36;
const PADDING = 0.01;
const TITLE_HEIGHT = 0.016;
const BUTTON_WIDTH = 0.08;
const BUTTON_HEIGHT = 0.026;

/**
 * The Elementalist's recipe book: the Primals and first fusions a player has discovered, the rest
 * as "???". A view of the local player's own book only: its text and whether it is open are local
 * (RecipeBook fills it), so nothing here is synced. The frames exist on every client alike.
 *
 * The texts have height 0, so each grows with its lines, and the panel's bottom follows the close
 * button under them: the panel fits whatever the book holds.
 */
export class RecipeBookPanel {
    private readonly panel: Frame;
    private readonly title: Frame;
    private readonly primals: Frame;
    private readonly firstLeft: Frame;
    private readonly firstRight: Frame;

    constructor() {
        const inner = PANEL_WIDTH - 2 * PADDING;
        this.panel = createPanel('recipeBookPanel', PANEL_WIDTH, 0);
        this.panel.setAbsPoint(FRAMEPOINT_TOP, 0.4, TOP_Y);

        this.title = createText('recipeBookTitle', this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER);
        this.title.setSize(inner, TITLE_HEIGHT);
        this.title.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, -PADDING);

        this.primals = createText('recipeBookPrimals', this.panel, '', TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_LEFT);
        this.primals.setSize(inner, 0);
        this.primals.setPoint(FRAMEPOINT_TOP, this.title, FRAMEPOINT_BOTTOM, 0, -PADDING);

        // First fusions in two columns; the left one holds the extra line of an odd count
        this.firstLeft = createText('recipeBookFirstLeft', this.panel, '', TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_LEFT);
        this.firstLeft.setSize(inner / 2, 0);
        this.firstLeft.setPoint(FRAMEPOINT_TOPLEFT, this.primals, FRAMEPOINT_BOTTOMLEFT, 0, -PADDING);
        this.firstRight = createText('recipeBookFirstRight', this.panel, '', TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_LEFT);
        this.firstRight.setSize(inner / 2, 0);
        this.firstRight.setPoint(FRAMEPOINT_TOPLEFT, this.firstLeft, FRAMEPOINT_TOPRIGHT, 0, 0);

        const close = createTextButton(this.panel, 'Close', BUTTON_WIDTH, BUTTON_HEIGHT);
        close.setPoint(FRAMEPOINT_TOP, this.firstLeft, FRAMEPOINT_BOTTOM, inner / 4, -PADDING);
        this.panel.setPoint(FRAMEPOINT_BOTTOM, close, FRAMEPOINT_BOTTOM, 0, -PADDING);
        onLocalClick(close, () => this.panel.setVisible(false));
    }

    /** Local: the local player's book. */
    public setContent(title: string, primals: string, firstLeft: string, firstRight: string): void {
        this.title.setText(title);
        this.primals.setText(primals);
        this.firstLeft.setText(firstLeft);
        this.firstRight.setText(firstRight);
    }

    /** Local. */
    public toggle(): void {
        this.panel.setVisible(!this.panel.visible);
    }
}
