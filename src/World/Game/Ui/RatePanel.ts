import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Defender} from '../../Entity/Players/Defender';
import {createBackdrop, createText, createTextButton, onLocalClick, uiRoot} from './Frames';
import {trackUiPress} from './UiPress';

/*
 * The end-of-game rating survey. Three layouts (from the Claude Design handoff) are built so they
 * can be compared in-game and one chosen; `-rate a|b|c` switches between them (debug). They share one
 * rating state - an Overall score plus one per bot-defined category, each 0-5 - so switching keeps
 * your picks. Rating is entirely local (each player rates their own game); the only sync is Submit,
 * which sends `adapt-rate` back to the host bot. Clicking the chosen value again clears it. There is
 * no hover-preview: this codebase bans FRAMEEVENT_MOUSE_ENTER/LEAVE (it flickers every tick, see
 * UiPress), so the fill follows clicks only.
 *
 * Shared fixes over the old panel: selected reads brighter than empty (lit gold vs dim), a word
 * (Poor..Great) replaces "n/5", Submit is disabled until something is rated, and Skip is quiet.
 */
const PANEL_TOP_X = 0.4;
const PANEL_TOP_Y = 0.52;
const EDGE = 0.020;
const PAD = 0.010;
const MAX_CATEGORIES = 5;
const MAX_ROWS = 1 + MAX_CATEGORIES;

const TITLE_HEIGHT = 0.024;
const ROW_HEIGHT = 0.026;
const LABEL_WIDTH = 0.072;
const WORD_WIDTH = 0.052;
const PIP_SIZE = 0.026;
const PIP_GAP = 0.005;
const BAR_HEIGHT = 0.016;
const BUTTON_WIDTH = 0.072;
const BUTTON_HEIGHT = 0.026;
const STARS = 5;

// Stock textures: a beveled icon well for pips, solid team colours for fills and bars.
const ICON_WELL = 'uiImport\\CommandButtons\\frame-icon.dds';
const GOLD_FILL = 'ReplaceableTextures\\TeamColor\\TeamColor04.blp'; // yellow/gold
const SEG_EMPTY = 'ReplaceableTextures\\TeamColor\\TeamColor20.blp'; // coal (near-black)
const SEG_RED = 'ReplaceableTextures\\TeamColor\\TeamColor00.blp';
const SEG_AMBER = 'ReplaceableTextures\\TeamColor\\TeamColor04.blp';
const SEG_GREEN = 'ReplaceableTextures\\TeamColor\\TeamColor06.blp';

// A representative spread (Overall + categories) for the `-rate` debug preview screenshots.
const RATE_DEMO_SCORES = [5, 4, 3, 1, 5, 2];
const WORDS = ['—', 'Poor', 'Weak', 'Okay', 'Good', 'Great'];
const COLOUR_SET = 'f2d27a';   // a rated score
const COLOUR_UNSET = '6e6553'; // nothing yet
// Star flavour: a custom gold star texture, full when lit and dimmed when empty.
const STAR_TEXTURE = 'uiImport\\Rate\\star.dds';
const STAR_ALPHA_LIT = 255;
const STAR_ALPHA_EMPTY = 55;

function coloured(hex: string, text: string): string {
    return `|cff${hex}${text}|r`;
}

/** The word for a score, coloured gold when set and grey when not. */
function scoreWord(value: number): string {
    return coloured(value > 0 ? COLOUR_SET : COLOUR_UNSET, WORDS[value] ?? WORDS[0]);
}

/** A 5-part bar's colour for its level: red low, amber middle, green high (1c). */
function segColour(value: number): string {
    if (value <= 2) {
        return SEG_RED;
    }
    return value === 3 ? SEG_AMBER : SEG_GREEN;
}

/** One rating state: Overall at index 0, then one per category. */
interface RateVariant {
    render(labels: string[], scores: number[]): void;
    setVisible(visible: boolean): void;
}

/** A numbered pip: an icon well, a gold fill shown when lit, the number over both, a click button. */
class RatePip {
    public readonly frame: Frame;
    private readonly fill: Frame;
    private readonly num: Frame;

    constructor(game: WarcraftMaul, name: string, parent: Frame, size: number, value: number, onClick: (this: void) => void) {
        this.frame = createBackdrop(`${name}Cell`, parent, ICON_WELL);
        this.frame.setSize(size, size);
        const inset = size * 0.16;
        this.fill = createBackdrop(`${name}Fill`, this.frame, GOLD_FILL);
        this.fill.setPoint(FRAMEPOINT_TOPLEFT, this.frame, FRAMEPOINT_TOPLEFT, inset, -inset);
        this.fill.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.frame, FRAMEPOINT_BOTTOMRIGHT, -inset, inset);
        this.fill.setVisible(false);
        this.num = createText(`${name}Num`, this.frame, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_CENTER);
        this.num.setPoint(FRAMEPOINT_TOPLEFT, this.frame, FRAMEPOINT_TOPLEFT, 0, 0);
        this.num.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.frame, FRAMEPOINT_BOTTOMRIGHT, 0, 0);
        this.num.setText(coloured(COLOUR_UNSET, `${value}`));
        const button = Frame.createType(name, this.frame, 0, 'BUTTON', 'CustomIconButton')!;
        button.setAllPoints(this.frame);
        onLocalClick(button, onClick);
        trackUiPress(game, button);
    }

    public set(value: number, lit: boolean): void {
        this.fill.setVisible(lit);
        this.num.setText(coloured(lit ? '1c1304' : COLOUR_UNSET, `${value}`));
    }

    public setVisible(visible: boolean): void {
        this.frame.setVisible(visible);
    }
}

/** A rating cell: lit up to the chosen value or not. Segments (bars) and stars both implement it. */
interface RateCell {
    readonly frame: Frame;
    set(lit: boolean, colour: string): void;
    setVisible(visible: boolean): void;
    /** Optional: size the glyph to the cell (stars); segments ignore it. */
    fit?(height: number): void;
}

/** One segment of a bar: a coloured block when lit, coal when empty, with a click button. */
class RateSegment implements RateCell {
    public readonly frame: Frame;

    constructor(game: WarcraftMaul, name: string, parent: Frame, onClick: (this: void) => void) {
        this.frame = createBackdrop(name, parent, SEG_EMPTY);
        const button = Frame.createType(`${name}Btn`, this.frame, 0, 'BUTTON', 'CustomIconButton')!;
        button.setAllPoints(this.frame);
        onLocalClick(button, onClick);
        trackUiPress(game, button);
    }

    public set(lit: boolean, colour: string): void {
        this.frame.setTexture(lit ? colour : SEG_EMPTY, 0, true);
    }

    public setVisible(visible: boolean): void {
        this.frame.setVisible(visible);
    }
}

/** One star: the gold star texture, full when lit and dimmed when empty, with a click button over it. */
class RateStar implements RateCell {
    public readonly frame: Frame;

    constructor(game: WarcraftMaul, name: string, parent: Frame, onClick: (this: void) => void) {
        this.frame = createBackdrop(name, parent, STAR_TEXTURE);
        this.frame.setAlpha(STAR_ALPHA_EMPTY);
        const button = Frame.createType(`${name}Btn`, this.frame, 0, 'BUTTON', 'CustomIconButton')!;
        button.setAllPoints(this.frame);
        onLocalClick(button, onClick);
        trackUiPress(game, button);
    }

    public set(lit: boolean, _colour: string): void {
        this.frame.setAlpha(lit ? STAR_ALPHA_LIT : STAR_ALPHA_EMPTY);
    }

    public setVisible(visible: boolean): void {
        this.frame.setVisible(visible);
    }
}

/** Builds the opaque, top-anchored panel every variant hangs off. */
function makePanel(name: string, width: number): Frame {
    const panel = Frame.createType(name, uiRoot(), 0, 'BACKDROP', 'EscMenuBackdrop')!;
    panel.setSize(width, 0.30);
    panel.setAbsPoint(FRAMEPOINT_TOP, PANEL_TOP_X, PANEL_TOP_Y);
    panel.setVisible(false);
    return panel;
}

function makeTitle(name: string, panel: Frame, width: number, text: string): Frame {
    const title = createText(name, panel, coloured('f2d27a', text), TEXT_JUSTIFY_MIDDLE);
    title.setSize(width - 2 * EDGE, TITLE_HEIGHT);
    title.setPoint(FRAMEPOINT_TOP, panel, FRAMEPOINT_TOP, 0, -EDGE);
    return title;
}

const ROW_PIPS_WIDTH = STARS * PIP_SIZE + (STARS - 1) * PIP_GAP;

// ---- 1a: numbered pips -------------------------------------------------------------------------
const PIPS_WIDTH = EDGE + LABEL_WIDTH + PAD + ROW_PIPS_WIDTH + PAD + WORD_WIDTH + EDGE;

class RatePipsPanel implements RateVariant {
    private readonly panel: Frame;
    private readonly header: Frame;
    private readonly rows: {label: Frame, pips: RatePip[], word: Frame}[] = [];
    private readonly progress: Frame;
    private readonly skip: Frame;
    private readonly submit: Frame;
    private readonly firstRowY: number;

    constructor(game: WarcraftMaul, onRate: (this: void, index: number, value: number) => void,
                onSubmit: (this: void) => void, onSkip: (this: void) => void) {
        this.panel = makePanel('ratePips', PIPS_WIDTH);
        makeTitle('ratePipsTitle', this.panel, PIPS_WIDTH, 'Rate this game');

        const pipsX = EDGE + LABEL_WIDTH + PAD;
        this.header = createText('ratePipsHeader', this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
        this.header.setSize(ROW_PIPS_WIDTH, 0.014);
        this.header.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, pipsX, -EDGE - TITLE_HEIGHT - PAD);
        this.header.setText(`${coloured('8f8466', 'Poor')}                 ${coloured('8f8466', 'Great')}`);

        this.firstRowY = -EDGE - TITLE_HEIGHT - PAD - 0.014 - PAD / 2;
        for (let r = 0; r < MAX_ROWS; r++) {
            const row = r;
            const y = this.firstRowY - row * ROW_HEIGHT;
            const label = createText(`ratePipsLabel${row}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            label.setSize(LABEL_WIDTH, ROW_HEIGHT);
            label.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, y);
            const pips: RatePip[] = [];
            for (let i = 0; i < STARS; i++) {
                const value = i + 1;
                const pip = new RatePip(game, `ratePips${row}_${i}`, this.panel, PIP_SIZE, value, () => onRate(row, value));
                pip.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT,
                    pipsX + i * (PIP_SIZE + PIP_GAP), y);
                pips.push(pip);
            }
            const word = createText(`ratePipsWord${row}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            word.setSize(WORD_WIDTH, ROW_HEIGHT);
            word.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, pipsX + ROW_PIPS_WIDTH + PAD, y);
            this.rows.push({label, pips, word});
        }

        this.progress = createText('ratePipsProgress', this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
        this.progress.setSize(0.12, ROW_HEIGHT);
        this.skip = createTextButton(this.panel, 'Skip', BUTTON_WIDTH, BUTTON_HEIGHT);
        onLocalClick(this.skip, onSkip);
        this.submit = createTextButton(this.panel, 'Submit', BUTTON_WIDTH, BUTTON_HEIGHT);
        onLocalClick(this.submit, onSubmit);
    }

    public render(labels: string[], scores: number[]): void {
        this.rows.forEach((row, r) => {
            const visible = r < labels.length;
            row.label.setVisible(visible);
            row.word.setVisible(visible);
            row.pips.forEach(pip => pip.setVisible(visible));
            if (!visible) {
                return;
            }
            row.label.setText(coloured('e2d8c0', labels[r]));
            row.word.setText(scoreWord(scores[r]));
            row.pips.forEach((pip, i) => pip.set(i + 1, i < scores[r]));
        });

        const rated = scores.filter(s => s > 0).length;
        this.progress.setText(coloured('8f8466', rated > 0 ? `${rated} of ${labels.length} rated` : 'Click to rate'));
        const buttonsY = this.firstRowY - labels.length * ROW_HEIGHT - PAD;
        this.progress.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, buttonsY - 0.004);
        this.submit.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE, buttonsY);
        this.skip.setPoint(FRAMEPOINT_TOPRIGHT, this.submit, FRAMEPOINT_TOPLEFT, -PAD, 0);
        BlzFrameSetEnable(this.submit.handle, rated > 0);
        this.panel.setSize(PIPS_WIDTH, -buttonsY + BUTTON_HEIGHT + EDGE);
    }

    public setVisible(visible: boolean): void {
        this.panel.setVisible(visible);
    }
}

// ---- 1b: overall first -------------------------------------------------------------------------
const OVERALL_WIDTH = 0.33;
const HERO_PIP = 0.040;
const SMALL_PIP = 0.020;
const SMALL_PIPS_WIDTH = STARS * SMALL_PIP + (STARS - 1) * PIP_GAP;

class RateOverallPanel implements RateVariant {
    private readonly panel: Frame;
    private readonly heroPips: RatePip[] = [];
    private readonly heroWord: Frame;
    private readonly optional: Frame;
    private readonly rows: {label: Frame, pips: RatePip[], word: Frame}[] = [];
    private readonly skip: Frame;
    private readonly submit: Frame;
    private readonly firstOptionY: number;

    constructor(game: WarcraftMaul, onRate: (this: void, index: number, value: number) => void,
                onSubmit: (this: void) => void, onSkip: (this: void) => void) {
        this.panel = makePanel('rateOverall', OVERALL_WIDTH);
        makeTitle('rateOverallTitle', this.panel, OVERALL_WIDTH, 'How was this game?');

        const heroWidth = STARS * HERO_PIP + (STARS - 1) * PIP_GAP;
        const heroX = (OVERALL_WIDTH - heroWidth) / 2;
        const heroY = -EDGE - TITLE_HEIGHT - PAD;
        for (let i = 0; i < STARS; i++) {
            const value = i + 1;
            const pip = new RatePip(game, `rateOverallHero${i}`, this.panel, HERO_PIP, value, () => onRate(0, value));
            pip.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, heroX + i * (HERO_PIP + PIP_GAP), heroY);
            this.heroPips.push(pip);
        }
        this.heroWord = createText('rateOverallHeroWord', this.panel, '', TEXT_JUSTIFY_MIDDLE);
        this.heroWord.setSize(OVERALL_WIDTH - 2 * EDGE, 0.020);
        this.heroWord.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, heroY - HERO_PIP - PAD / 2);

        this.optional = createText('rateOverallOptional', this.panel, coloured('8f8466', 'OPTIONAL'),
            TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
        this.optional.setSize(OVERALL_WIDTH - 2 * EDGE, 0.014);
        const optionalY = heroY - HERO_PIP - PAD / 2 - 0.020 - PAD;
        this.optional.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, optionalY);

        this.firstOptionY = optionalY - 0.014 - PAD / 2;
        const smallPipsX = EDGE + LABEL_WIDTH + PAD;
        for (let r = 0; r < MAX_CATEGORIES; r++) {
            const index = r + 1;
            const y = this.firstOptionY - r * ROW_HEIGHT;
            const label = createText(`rateOverallLabel${r}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            label.setSize(LABEL_WIDTH, ROW_HEIGHT);
            label.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, y);
            const pips: RatePip[] = [];
            for (let i = 0; i < STARS; i++) {
                const value = i + 1;
                const pip = new RatePip(game, `rateOverallSmall${r}_${i}`, this.panel, SMALL_PIP, value, () => onRate(index, value));
                pip.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, smallPipsX + i * (SMALL_PIP + PIP_GAP), y);
                pips.push(pip);
            }
            const word = createText(`rateOverallWord${r}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            word.setSize(WORD_WIDTH, ROW_HEIGHT);
            word.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, smallPipsX + SMALL_PIPS_WIDTH + PAD, y);
            this.rows.push({label, pips, word});
        }

        this.skip = createTextButton(this.panel, 'Not now', BUTTON_WIDTH, BUTTON_HEIGHT);
        onLocalClick(this.skip, onSkip);
        this.submit = createTextButton(this.panel, 'Submit', BUTTON_WIDTH, BUTTON_HEIGHT);
        onLocalClick(this.submit, onSubmit);
    }

    public render(labels: string[], scores: number[]): void {
        this.heroPips.forEach((pip, i) => pip.set(i + 1, i < scores[0]));
        this.heroWord.setText(scoreWord(scores[0]));
        const categories = labels.length - 1;
        this.optional.setVisible(categories > 0);
        this.rows.forEach((row, r) => {
            const visible = r < categories;
            row.label.setVisible(visible);
            row.word.setVisible(visible);
            row.pips.forEach(pip => pip.setVisible(visible));
            if (!visible) {
                return;
            }
            row.label.setText(coloured('cfc3a6', labels[r + 1]));
            row.word.setText(scoreWord(scores[r + 1]));
            row.pips.forEach((pip, i) => pip.set(i + 1, i < scores[r + 1]));
        });

        const buttonsY = this.firstOptionY - categories * ROW_HEIGHT - PAD;
        this.submit.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE, buttonsY);
        this.skip.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, buttonsY);
        BlzFrameSetEnable(this.submit.handle, scores[0] > 0);
        this.panel.setSize(OVERALL_WIDTH, -buttonsY + BUTTON_HEIGHT + EDGE);
    }

    public setVisible(visible: boolean): void {
        this.panel.setVisible(visible);
    }
}

// ---- 1c: segmented bars ------------------------------------------------------------------------
const BARS_WIDTH = 0.30;

class RateBarsPanel implements RateVariant {
    private readonly panel: Frame;
    private readonly rows: {label: Frame, word: Frame, segments: RateSegment[]}[] = [];
    private readonly progress: Frame;
    private readonly skip: Frame;
    private readonly submit: Frame;
    private readonly firstRowY: number;
    private readonly rowPitch: number = ROW_HEIGHT + BAR_HEIGHT + PAD / 2;

    constructor(game: WarcraftMaul, onRate: (this: void, index: number, value: number) => void,
                onSubmit: (this: void) => void, onSkip: (this: void) => void) {
        this.panel = makePanel('rateBars', BARS_WIDTH);
        makeTitle('rateBarsTitle', this.panel, BARS_WIDTH, 'Rate this game');

        const barWidth = BARS_WIDTH - 2 * EDGE;
        const segWidth = (barWidth - (STARS - 1) * PIP_GAP) / STARS;
        this.firstRowY = -EDGE - TITLE_HEIGHT - PAD;
        for (let r = 0; r < MAX_ROWS; r++) {
            const row = r;
            const y = this.firstRowY - row * this.rowPitch;
            const label = createText(`rateBarsLabel${row}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            label.setSize(barWidth * 0.6, ROW_HEIGHT);
            label.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, y);
            const word = createText(`rateBarsWord${row}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_RIGHT);
            word.setSize(barWidth * 0.4, ROW_HEIGHT);
            word.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE, y);
            const segY = y - ROW_HEIGHT;
            const segments: RateSegment[] = [];
            for (let i = 0; i < STARS; i++) {
                const value = i + 1;
                const seg = new RateSegment(game, `rateBars${row}_${i}`, this.panel, () => onRate(row, value));
                seg.frame.setSize(segWidth, BAR_HEIGHT);
                seg.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE + i * (segWidth + PIP_GAP), segY);
                segments.push(seg);
            }
            this.rows.push({label, word, segments});
        }

        this.progress = createText('rateBarsProgress', this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
        this.progress.setSize(0.12, ROW_HEIGHT);
        this.skip = createTextButton(this.panel, 'Skip', BUTTON_WIDTH, BUTTON_HEIGHT);
        onLocalClick(this.skip, onSkip);
        this.submit = createTextButton(this.panel, 'Submit', BUTTON_WIDTH, BUTTON_HEIGHT);
        onLocalClick(this.submit, onSubmit);
    }

    public render(labels: string[], scores: number[]): void {
        this.rows.forEach((row, r) => {
            const visible = r < labels.length;
            row.label.setVisible(visible);
            row.word.setVisible(visible);
            row.segments.forEach(seg => seg.setVisible(visible));
            if (!visible) {
                return;
            }
            row.label.setText(coloured('e2d8c0', labels[r]));
            row.word.setText(scoreWord(scores[r]));
            const colour = segColour(scores[r]);
            row.segments.forEach((seg, i) => seg.set(i < scores[r], colour));
        });

        const rated = scores.filter(s => s > 0).length;
        this.progress.setText(coloured('8f8466', rated > 0 ? `${rated} of ${labels.length} rated` : 'Click to rate'));
        const buttonsY = this.firstRowY - labels.length * this.rowPitch - PAD / 2;
        this.progress.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, buttonsY - 0.004);
        this.submit.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE, buttonsY);
        this.skip.setPoint(FRAMEPOINT_TOPRIGHT, this.submit, FRAMEPOINT_TOPLEFT, -PAD, 0);
        BlzFrameSetEnable(this.submit.handle, rated > 0);
        this.panel.setSize(BARS_WIDTH, -buttonsY + BUTTON_HEIGHT + EDGE);
    }

    public setVisible(visible: boolean): void {
        this.panel.setVisible(visible);
    }
}

// ---- overall-first combo (the operator's "combo of B and C"), in bars (1d) or stars (1e) -------
const COMBO_WIDTH = 0.32;
const HERO_BAR_HEIGHT = 0.030;
const HERO_STAR = 0.036;
const CAT_STAR = 0.022;
const BOX_PAD = 0.008;        // inner padding of the DETAILS inset box
const DIVIDER_SPACE = 0.009;  // room for the divider under the title
const TITLE_SCALE = 1.25;     // the title reads larger, like the mockup
const DIVIDER_TEXTURE = 'ReplaceableTextures\\TeamColor\\TeamColor04.blp';

class RateOverallComboPanel implements RateVariant {
    private readonly panel: Frame;
    private readonly useStars: boolean;
    private readonly catCell: number;
    private readonly hero: RateCell[];
    private readonly heroWord: Frame;
    private readonly detailsBox: Frame;
    private readonly detailsHeader: Frame;
    private readonly optionalTag: Frame;
    private readonly rows: {label: Frame, word: Frame, cells: RateCell[]}[] = [];
    private readonly skip: Frame;
    private readonly submit: Frame;
    private readonly detailsBoxTop: number;
    private readonly firstOptionY: number;
    private readonly rowPitch: number;

    constructor(game: WarcraftMaul, useStars: boolean,
                onRate: (this: void, index: number, value: number) => void,
                onSubmit: (this: void) => void, onSkip: (this: void) => void) {
        this.useStars = useStars;
        const prefix = useStars ? 'rateStars' : 'rateCombo';
        const heroCell = useStars ? HERO_STAR : HERO_BAR_HEIGHT;
        this.catCell = useStars ? CAT_STAR : BAR_HEIGHT;
        this.rowPitch = this.catCell + PAD;        // the category rows are one line each

        this.panel = makePanel(`${prefix}Panel`, COMBO_WIDTH);
        const title = makeTitle(`${prefix}Title`, this.panel, COMBO_WIDTH, 'How was this game?');
        BlzFrameSetScale(title.handle, TITLE_SCALE);

        const barWidth = COMBO_WIDTH - 2 * EDGE;
        const titleBottom = -EDGE - TITLE_HEIGHT * TITLE_SCALE;

        // A short gold divider under the title.
        const divider = createBackdrop(`${prefix}Divider`, this.panel, DIVIDER_TEXTURE);
        divider.setAlpha(90);
        divider.setSize(0.09, 0.0016);
        divider.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, titleBottom - 0.002);

        // Hero: the Overall row, big, with its word below.
        const heroY = titleBottom - DIVIDER_SPACE;
        this.hero = this.placeRow(game, `${prefix}Hero`, heroY, heroCell, EDGE, barWidth, i => () => onRate(0, i + 1));
        this.heroWord = createText(`${prefix}HeroWord`, this.panel, '', TEXT_JUSTIFY_MIDDLE);
        this.heroWord.setSize(barWidth, 0.020);
        const heroWordY = heroY - heroCell - PAD / 2;
        this.heroWord.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, heroWordY);

        // DETAILS inset box holding the optional category rows.
        this.detailsBoxTop = heroWordY - 0.020 - PAD;
        this.detailsBox = Frame.createType(`${prefix}Box`, this.panel, 0, 'BACKDROP', 'EscMenuControlBackdropTemplate')!;
        this.detailsBox.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, this.detailsBoxTop);
        const headerY = this.detailsBoxTop - BOX_PAD;
        this.detailsHeader = createText(`${prefix}Details`, this.panel, coloured('bfa76a', 'DETAILS'),
            TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
        this.detailsHeader.setSize(barWidth * 0.5, 0.013);
        this.detailsHeader.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE + BOX_PAD, headerY);
        this.optionalTag = createText(`${prefix}Opt`, this.panel, coloured('7d735c', 'optional'),
            TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_RIGHT);
        this.optionalTag.setSize(barWidth * 0.4, 0.013);
        this.optionalTag.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE - BOX_PAD, headerY);

        // Category rows inside the box: label · stars · word, inline.
        this.firstOptionY = headerY - 0.013 - PAD / 2;
        const contentLeft = EDGE + BOX_PAD;
        const contentWidth = barWidth - 2 * BOX_PAD;
        const labelW = 0.050;
        const wordW = 0.050;
        const widgetLeft = contentLeft + labelW + 0.004;
        const widgetWidth = contentWidth - labelW - wordW - 0.008;
        for (let r = 0; r < MAX_CATEGORIES; r++) {
            const index = r + 1;
            const y = this.firstOptionY - r * this.rowPitch;
            const label = createText(`${prefix}Label${r}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            label.setSize(labelW, this.catCell);
            label.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, contentLeft, y);
            const word = createText(`${prefix}Word${r}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_RIGHT);
            word.setSize(wordW, this.catCell);
            word.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE - BOX_PAD, y);
            const cells = this.placeRow(game, `${prefix}${r}_`, y, this.catCell, widgetLeft, widgetWidth,
                i => () => onRate(index, i + 1));
            this.rows.push({label, word, cells});
        }

        this.skip = createTextButton(this.panel, 'Not now', BUTTON_WIDTH, BUTTON_HEIGHT);
        onLocalClick(this.skip, onSkip);
        this.submit = createTextButton(this.panel, 'Submit', 0.10, BUTTON_HEIGHT);
        onLocalClick(this.submit, onSubmit);
    }

    /** Lays a row of 5 cells across [startX, startX+width]: filled segments (bars) or centred squares (stars). */
    private placeRow(game: WarcraftMaul, prefix: string, y: number, size: number, startX: number, width: number,
                     onRateFor: (this: void, i: number) => (this: void) => void): RateCell[] {
        const cells: RateCell[] = [];
        if (this.useStars) {
            const slot = width / STARS;
            for (let i = 0; i < STARS; i++) {
                const cell = new RateStar(game, `${prefix}${i}`, this.panel, onRateFor(i));
                cell.frame.setSize(size, size);
                cell.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT,
                    startX + i * slot + (slot - size) / 2, y);
                cells.push(cell);
            }
        } else {
            const segW = (width - (STARS - 1) * PIP_GAP) / STARS;
            for (let i = 0; i < STARS; i++) {
                const cell = new RateSegment(game, `${prefix}${i}`, this.panel, onRateFor(i));
                cell.frame.setSize(segW, size);
                cell.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, startX + i * (segW + PIP_GAP), y);
                cells.push(cell);
            }
        }
        return cells;
    }

    public render(labels: string[], scores: number[]): void {
        const heroColour = segColour(scores[0]);
        this.hero.forEach((cell, i) => cell.set(i < scores[0], heroColour));
        this.heroWord.setText(scores[0] > 0 ? scoreWord(scores[0]) : coloured(COLOUR_UNSET, 'Pick a score'));
        const categories = labels.length - 1;
        this.detailsBox.setVisible(categories > 0);
        this.detailsHeader.setVisible(categories > 0);
        this.optionalTag.setVisible(categories > 0);
        this.rows.forEach((row, r) => {
            const visible = r < categories;
            row.label.setVisible(visible);
            row.word.setVisible(visible);
            row.cells.forEach(cell => cell.setVisible(visible));
            if (!visible) {
                return;
            }
            row.label.setText(coloured('cfc3a6', labels[r + 1]));
            row.word.setText(scoreWord(scores[r + 1]));
            const colour = segColour(scores[r + 1]);
            row.cells.forEach((cell, i) => cell.set(i < scores[r + 1], colour));
        });

        const barWidth = COMBO_WIDTH - 2 * EDGE;
        let buttonsY: number;
        if (categories > 0) {
            const lastRowBottom = this.firstOptionY - (categories - 1) * this.rowPitch - this.catCell;
            const boxBottom = lastRowBottom - BOX_PAD;
            this.detailsBox.setSize(barWidth, this.detailsBoxTop - boxBottom);
            buttonsY = boxBottom - PAD;
        } else {
            buttonsY = this.detailsBoxTop - PAD;
        }
        this.submit.setText(scores[0] > 0 ? `Submit · ${WORDS[scores[0]]}` : 'Submit');
        this.submit.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE, buttonsY);
        this.skip.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, buttonsY);
        BlzFrameSetEnable(this.submit.handle, scores[0] > 0);
        this.panel.setSize(COMBO_WIDTH, -buttonsY + BUTTON_HEIGHT + EDGE);
    }

    public setVisible(visible: boolean): void {
        this.panel.setVisible(visible);
    }
}

// ---- mid-game: a compact, left-edge widget that doesn't steal focus ------------------------------
// Shown while a wave is on (bot's rate-now / rate-at:wave), where the centred panel would cover play.
// Same stars + shared scores as the end-game panel, just small and anchored to the left so the game
// stays visible. Overall is always shown; the bot's detail rows appear only if it set any.
const LEFT_WIDTH = 0.165;
const LEFT_X = 0.004;         // top-left corner, just off the left edge
const LEFT_TOP_Y = 0.555;     // just below the top tab bar; grows downward
// Hero stars sized to span the inner width exactly (5 stars + 4 gaps), so they never overflow.
const LEFT_HERO_STAR = (LEFT_WIDTH - 2 * EDGE - (STARS - 1) * PIP_GAP) / STARS;
const LEFT_CAT_STAR = 0.016;
const LEFT_LABEL_W = 0.040;
const LEFT_WORD_W = 0.040;

class RateLeftPanel implements RateVariant {
    private readonly panel: Frame;
    private readonly hero: RateStar[] = [];
    private readonly heroWord: Frame;
    private readonly rows: {label: Frame, word: Frame, cells: RateStar[]}[] = [];
    private readonly skip: Frame;
    private readonly submit: Frame;
    private readonly heroWordY: number;
    private readonly firstCatY: number;
    private readonly rowPitch: number = LEFT_CAT_STAR + PAD;

    constructor(game: WarcraftMaul, onRate: (this: void, index: number, value: number) => void,
                onSubmit: (this: void) => void, onSkip: (this: void) => void) {
        this.panel = Frame.createType('rateLeftPanel', uiRoot(), 0, 'BACKDROP', 'EscMenuBackdrop')!;
        this.panel.setSize(LEFT_WIDTH, 0.20);
        this.panel.setAbsPoint(FRAMEPOINT_TOPLEFT, LEFT_X, LEFT_TOP_Y);
        this.panel.setVisible(false);

        const innerW = LEFT_WIDTH - 2 * EDGE;
        const title = createText('rateLeftTitle', this.panel, coloured('f2d27a', 'Rate this game'), TEXT_JUSTIFY_MIDDLE);
        title.setSize(innerW, TITLE_HEIGHT);
        title.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, -EDGE);

        // Hero: the Overall stars, centred, with the word below.
        const heroY = -EDGE - TITLE_HEIGHT - PAD;
        const heroWidth = STARS * LEFT_HERO_STAR + (STARS - 1) * PIP_GAP;
        const heroX = (LEFT_WIDTH - heroWidth) / 2;
        for (let i = 0; i < STARS; i++) {
            const star = new RateStar(game, `rateLeftHero${i}`, this.panel, () => onRate(0, i + 1));
            star.frame.setSize(LEFT_HERO_STAR, LEFT_HERO_STAR);
            star.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, heroX + i * (LEFT_HERO_STAR + PIP_GAP), heroY);
            this.hero.push(star);
        }
        this.heroWord = createText('rateLeftHeroWord', this.panel, '', TEXT_JUSTIFY_MIDDLE);
        this.heroWord.setSize(innerW, 0.016);
        this.heroWordY = heroY - LEFT_HERO_STAR - PAD / 2;
        this.heroWord.setPoint(FRAMEPOINT_TOP, this.panel, FRAMEPOINT_TOP, 0, this.heroWordY);

        // Optional compact category rows (label · stars · word), shown only if the bot set any.
        this.firstCatY = this.heroWordY - 0.016 - PAD;
        const starsLeft = EDGE + LEFT_LABEL_W + 0.003;
        const starsW = innerW - LEFT_LABEL_W - LEFT_WORD_W - 0.006;
        const slot = starsW / STARS;
        const catSize = Math.min(LEFT_CAT_STAR, slot);  // never wider than its slot
        for (let r = 0; r < MAX_CATEGORIES; r++) {
            const index = r + 1;
            const y = this.firstCatY - r * this.rowPitch;
            const label = createText(`rateLeftLabel${r}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
            label.setSize(LEFT_LABEL_W, LEFT_CAT_STAR);
            label.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, y);
            const word = createText(`rateLeftWord${r}`, this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_RIGHT);
            word.setSize(LEFT_WORD_W, LEFT_CAT_STAR);
            word.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE, y);
            const cells: RateStar[] = [];
            for (let i = 0; i < STARS; i++) {
                const star = new RateStar(game, `rateLeft${r}_${i}`, this.panel, () => onRate(index, i + 1));
                star.frame.setSize(catSize, catSize);
                star.frame.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT,
                    starsLeft + i * slot + (slot - catSize) / 2, y);
                cells.push(star);
            }
            this.rows.push({label, word, cells});
        }

        // Two buttons share the inner width, each just under half so the text stays on one line.
        const buttonW = (LEFT_WIDTH - 2 * EDGE - PAD) / 2;
        this.skip = createTextButton(this.panel, 'Not now', buttonW, BUTTON_HEIGHT);
        onLocalClick(this.skip, onSkip);
        this.submit = createTextButton(this.panel, 'Submit', buttonW, BUTTON_HEIGHT);
        onLocalClick(this.submit, onSubmit);
    }

    public render(labels: string[], scores: number[]): void {
        this.hero.forEach((star, i) => star.set(i < scores[0], ''));
        this.heroWord.setText(scores[0] > 0 ? scoreWord(scores[0]) : coloured(COLOUR_UNSET, 'Tap a star'));
        const categories = labels.length - 1;
        this.rows.forEach((row, r) => {
            const visible = r < categories;
            row.label.setVisible(visible);
            row.word.setVisible(visible);
            row.cells.forEach(cell => cell.setVisible(visible));
            if (!visible) {
                return;
            }
            row.label.setText(coloured('cfc3a6', labels[r + 1]));
            row.word.setText(scoreWord(scores[r + 1]));
            row.cells.forEach((cell, i) => cell.set(i < scores[r + 1], ''));
        });

        const buttonsY = categories > 0
            ? this.firstCatY - (categories - 1) * this.rowPitch - LEFT_CAT_STAR - PAD
            : this.heroWordY - 0.016 - PAD;
        // Compact widget: just "Submit" (the end-game panel shows the chosen word; here width is tight).
        this.submit.setPoint(FRAMEPOINT_TOPRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, -EDGE, buttonsY);
        this.skip.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, EDGE, buttonsY);
        BlzFrameSetEnable(this.submit.handle, scores[0] > 0);
        this.panel.setSize(LEFT_WIDTH, -buttonsY + BUTTON_HEIGHT + EDGE);
    }

    public setVisible(visible: boolean): void {
        this.panel.setVisible(visible);
    }
}

/**
 * Coordinates the variants: owns the shared scores, routes rating clicks, and sends the result on
 * Submit. The end-game survey shows the operator's chosen combo (1d); `-rate a/b/c/d` switches for
 * comparison. show() is local-gated (each player rates their own game); submit sends an `adapt-rate`
 * sync the host bot records.
 */
export class RatePanel {
    private readonly game: WarcraftMaul;
    private readonly variants: RateVariant[];
    // The compact left-edge widget shown mid-game (rate-now / rate-at:wave), where the centred panel
    // would cover play. The centre variants above are for the end-of-game win/loss prompt.
    private readonly leftPanel: RateLeftPanel;
    // Whichever presentation is currently on screen (a centre variant, or the left widget).
    private active: RateVariant | undefined;
    // Defaults to the operator's chosen combo with stars (1e); -rate a/b/c/d/e switches for comparison.
    private variant: number = 4;
    private labels: string[] = [];
    private scores: number[] = [];
    private shown: boolean = false;
    // A -rate debug preview submits as `adapt-rate-preview` so test ratings stay out of the real stats.
    private preview: boolean = false;
    // Set once the player responds to the real survey (submit or skip); no trigger re-asks after that.
    private done: boolean = false;

    constructor(game: WarcraftMaul) {
        this.game = game;
        const onRate = (index: number, value: number): void => this.rate(index, value);
        const onSubmit = (): void => this.submit();
        const onSkip = (): void => this.close();
        this.variants = [
            new RatePipsPanel(game, onRate, onSubmit, onSkip),
            new RateOverallPanel(game, onRate, onSubmit, onSkip),
            new RateBarsPanel(game, onRate, onSubmit, onSkip),
            new RateOverallComboPanel(game, false, onRate, onSubmit, onSkip),
            new RateOverallComboPanel(game, true, onRate, onSubmit, onSkip),
        ];
        this.leftPanel = new RateLeftPanel(game, onRate, onSubmit, onSkip);
    }

    /** Every presentation, so one show hides the rest. */
    private allPanels(): RateVariant[] {
        return [...this.variants, this.leftPanel];
    }

    /** End-of-game survey (win/loss): the centred panel, local only, from the bot's categories. */
    public show(player: Defender): void {
        if (!this.game.rateEnabled || !player.isLocal() || this.done) {
            return;
        }
        this.preview = false;
        this.display(player, this.gatherLabels(), this.variants[this.variant]);
    }

    /** Mid-game survey (rate-now / rate-at:wave): the compact left widget, so play stays visible. */
    public showMidGame(player: Defender): void {
        if (!this.game.rateEnabled || !player.isLocal() || this.done) {
            return;
        }
        this.preview = false;
        this.display(player, this.gatherLabels(), this.leftPanel);
    }

    /** Debug: force-shows a chosen centre variant with demo categories if the bot set none. */
    public debugShow(player: Defender, variant: number): void {
        if (!player.isLocal()) {
            return;
        }
        this.preview = true;
        this.variant = variant % this.variants.length;
        const labels = this.gatherLabels();
        const shown = labels.length > 1 ? labels : ['Overall', 'Balance', 'Fun', 'Pacing'];
        this.display(player, shown, this.variants[this.variant]);
        // Pre-fill a representative spread so a preview screenshot shows the coloured state - the
        // harness can't click to rate. Covers green (5/4), amber (3) and red (1).
        this.scores = this.labels.map((_, i) => RATE_DEMO_SCORES[i] ?? 0);
        this.variants[this.variant].render(this.labels, this.scores);
    }

    /** Debug: force-shows the mid-game left widget. Overall-only unless the bot set categories. */
    public debugShowMid(player: Defender): void {
        if (!player.isLocal()) {
            return;
        }
        this.preview = true;
        const labels = this.gatherLabels();
        this.display(player, labels, this.leftPanel);
        this.scores = this.labels.map((_, i) => RATE_DEMO_SCORES[i] ?? 0);
        this.leftPanel.render(this.labels, this.scores);
    }

    private gatherLabels(): string[] {
        const labels: string[] = ['Overall'];
        for (let i = 0; i < MAX_CATEGORIES; i++) {
            const label = this.game.rateCategories[i];
            if (label !== undefined && label !== '') {
                labels.push(label);
            }
        }
        return labels;
    }

    private display(player: Defender, labels: string[], presentation: RateVariant): void {
        this.labels = labels;
        this.scores = labels.map(() => 0);
        this.shown = true;
        this.active = presentation;
        this.allPanels().forEach(p => p.setVisible(p === presentation));
        presentation.render(this.labels, this.scores);
    }

    /** Debug: submits the shown panel headlessly (the harness can't click Submit), for the desync gate. */
    public debugSubmit(): void {
        this.submit();
    }

    private rate(index: number, value: number): void {
        if (!this.shown || index < 0 || index >= this.scores.length) {
            return;
        }
        // Click the chosen value again to clear it.
        this.scores[index] = this.scores[index] === value ? 0 : value;
        this.active?.render(this.labels, this.scores);
    }

    private submit(): void {
        if (!this.shown) {
            return;
        }
        this.shown = false;
        // A debug preview reports on a separate command so it never lands in the real ratings.
        this.game.playerSync.send(this.preview ? 'adapt-rate-preview' : 'adapt-rate', this.scores.join(':'));
        this.active?.setVisible(false);
        if (!this.preview) {
            this.done = true;
            // Submit runs on the submitter's own client, so the thanks goes to the right player.
            this.game.players.get(GetPlayerId(GetLocalPlayer()))?.sendMessage('|cFFF48C42Thanks for rating this game!|r');
        }
    }

    private close(): void {
        this.shown = false;
        this.active?.setVisible(false);
        // Any dismissal (mid-game or end-game) consumes the one ask per player per game, so the
        // end-game fallback does not re-ask after a mid-game prompt was shown and answered.
        if (!this.preview) {
            this.done = true;
        }
    }

    /** Esc dismisses the survey for the local player (hooked into Defender's escape trigger). */
    public escape(player: Defender): void {
        if (player.isLocal() && this.shown) {
            this.close();
        }
    }
}
