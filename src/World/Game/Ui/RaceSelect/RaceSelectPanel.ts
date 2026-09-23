import {Frame, Timer, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {trackUiPress} from '../UiPress';
import {Defender} from '../../../Entity/Players/Defender';
import {Race} from '../../Races/Race';
import {RACE_TIERS, RaceItemDef, RaceItems, RaceTier, RANDOM_PICK_ITEMS} from '../../Races/RaceItems';
import {IconButton} from '../IconButton';
import {RaceListRow} from './RaceListRow';
import {createPanel, createText, createTextButton, onLocalClick} from '../Frames';

// Three columns: [categories] [scrolling race list] [information]
// Slightly right of centre so the left edge clears the vote panel (0.00-0.14) with a gap
const PANEL_CENTER_X = 0.415;
const PANEL_CENTER_Y = 0.34;
const PANEL_HEIGHT = 0.30;
const PADDING = 0.012;

const CATEGORY_WIDTH = 0.10;
const CATEGORY_HEIGHT = 0.028;
const CATEGORY_SPACING = 0.034;

const LIST_WIDTH = 0.19;
const ROW_HEIGHT = 0.026;
const VISIBLE_ROWS = 8;
const SCROLLBAR_WIDTH = 0.008;

const INFO_WIDTH = 0.19;
const INFO_ICON = 0.05;
const PICK_BUTTON_WIDTH = 0.1;
const PICK_BUTTON_HEIGHT = 0.03;
// A sent pick that never comes back (it always should) frees the button after this long
const PICK_TIMEOUT = 3;
const CLOSE_BUTTON = 0.022;

const PANEL_WIDTH = PADDING + CATEGORY_WIDTH + PADDING + LIST_WIDTH + SCROLLBAR_WIDTH + PADDING + INFO_WIDTH + PADDING;

/**
 * Race selection replacing the race shops: category tabs on the left, a scrolling list of the
 * races in that category (icon + name), and details of the highlighted one on the right, with a
 * Pick button. Frame click events fire on every client with the clicking player, so every
 * handler here is gated to `GetTriggerPlayer() === GetLocalPlayer()`: category, scroll and
 * highlight are the local player's view only. Picking sends a sync message (once, from the
 * clicker's client) so the choice is applied on every client through RacePicking.
 */
export class RaceSelectPanel {
    private readonly panel: Frame;
    private readonly categoryButtons: Map<RaceTier, Frame> = new Map<RaceTier, Frame>();
    private readonly rows: RaceListRow[] = [];
    private readonly scrollbar: Frame | undefined;
    private readonly infoIcon: Frame;
    private readonly infoName: Frame;
    private readonly infoText: Frame;
    private readonly pickButton: Frame;
    private pickInFlight: boolean = false;
    private readonly pickSettle: Timer = Timer.create();
    // Local client state
    private selectedTier: RaceTier = 'Beginner';
    private currentItems: RaceItemDef[] = [];
    private scrollOffset: number = 0;
    private highlightedItem: string | undefined;
    private visibleLocally: boolean = false;

    constructor(private readonly game: WarcraftMaul) {
        this.panel = createPanel('raceSelectPanel', PANEL_WIDTH, PANEL_HEIGHT);
        this.panel.setAbsPoint(FRAMEPOINT_CENTER, PANEL_CENTER_X, PANEL_CENTER_Y);

        // Categories: the normal tiers, plus a Dev tab in debug builds for the races you cannot
        // normally select (disabled races and the random-only Loot Boxer)
        const tiers: RaceTier[] = game.debugMode ? [...RACE_TIERS, 'Dev'] : RACE_TIERS;
        tiers.forEach((tier, index) => {
            const button = createTextButton(this.panel, tier, CATEGORY_WIDTH, CATEGORY_HEIGHT);
            button.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, PADDING, -PADDING - index * CATEGORY_SPACING);
            onLocalClick(button, () => this.showTier(tier));
            trackUiPress(game, button);
            this.categoryButtons.set(tier, button);
        });

        // Scrolling race list, offsets from the panel's top-left
        const listLeft = PADDING + CATEGORY_WIDTH + PADDING;
        for (const index of Array.from({length: VISIBLE_ROWS}, (_, i) => i)) {
            this.rows.push(new RaceListRow(game, `raceSelectRow${index}`, this.panel,
                listLeft, -PADDING - index * ROW_HEIGHT, LIST_WIDTH, ROW_HEIGHT,
                itemId => this.highlight(itemId),
                up => this.wheelScroll(up)));
        }

        // Scrollbar down the right of the list. Flow is one-directional to avoid a feedback
        // loop: the wheel and showTier move the slider value, and only the slider's
        // value-changed event scrolls the rows. scrollTo never writes the slider.
        this.scrollbar = Frame.createType('raceSelectScroll', this.panel, 0, 'SLIDER', 'EscMenuScrollBarTemplate');
        if (this.scrollbar) {
            this.scrollbar.setSize(SCROLLBAR_WIDTH, VISIBLE_ROWS * ROW_HEIGHT);
            this.scrollbar.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, listLeft + LIST_WIDTH, -PADDING);
            this.scrollbar.setStepSize(1);
            const scrollTrigger = Trigger.create();
            scrollTrigger.triggerRegisterFrameEvent(this.scrollbar, FRAMEEVENT_SLIDER_VALUE_CHANGED);
            // The scrollbar runs top=max, so the offset is the inverted value. Only a drag by
            // the local player scrolls this client's list; wheel and showTier scroll directly.
            scrollTrigger.addAction(() => {
                if (GetTriggerPlayer() !== GetLocalPlayer()) {
                    return;
                }
                this.scrollTo(this.maxScroll() - Math.floor(Frame.getEventValue() + 0.5));
            });
        }

        // Information
        const infoLeft = listLeft + LIST_WIDTH + SCROLLBAR_WIDTH + PADDING;
        this.infoIcon = Frame.createType('raceSelectInfoIcon', this.panel, 0, 'BACKDROP', '')!;
        this.infoIcon.setSize(INFO_ICON, INFO_ICON);
        this.infoIcon.setPoint(FRAMEPOINT_TOPLEFT, this.panel, FRAMEPOINT_TOPLEFT, infoLeft, -PADDING);
        this.infoName = createText('raceSelectInfoName', this.panel, '', TEXT_JUSTIFY_MIDDLE, TEXT_JUSTIFY_LEFT);
        this.infoName.setSize(INFO_WIDTH - INFO_ICON - 0.006, INFO_ICON);
        this.infoName.setPoint(FRAMEPOINT_TOPLEFT, this.infoIcon, FRAMEPOINT_TOPRIGHT, 0.006, 0);
        this.infoText = createText('raceSelectInfoText', this.panel, '', TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_LEFT);
        this.infoText.setSize(INFO_WIDTH, PANEL_HEIGHT - 2 * PADDING - INFO_ICON - PICK_BUTTON_HEIGHT - 0.02);
        this.infoText.setPoint(FRAMEPOINT_TOPLEFT, this.infoIcon, FRAMEPOINT_BOTTOMLEFT, 0, -0.008);

        this.pickButton = createTextButton(this.panel, 'Pick', PICK_BUTTON_WIDTH, PICK_BUTTON_HEIGHT);
        this.pickButton.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.panel, FRAMEPOINT_BOTTOMRIGHT, -PADDING, PADDING);
        // Only the clicker's client sends; the sync handler applies the pick everywhere
        onLocalClick(this.pickButton, () => {
            // One pick at a time: clicks land faster than the sync comes back, and every
            // click used to send another pick, so a spammed button bought the race several
            // times over whenever the player had picks left (Blitz hands out extra ones)
            if (this.highlightedItem !== undefined && !this.pickInFlight) {
                this.pickInFlight = true;
                this.pickButton.setEnabled(false);
                this.pickSettle.start(PICK_TIMEOUT, false, () => this.settlePick());
                game.playerSync.send('race-pick', this.highlightedItem);
            }
        });
        trackUiPress(game, this.pickButton);

        // Close: just outside the top-right corner so it never overlaps the race name
        const close = new IconButton(game, 'raceSelectClose', this.panel, CLOSE_BUTTON,
            player => this.close(player), false);
        close.frame.setPoint(FRAMEPOINT_BOTTOMRIGHT, this.panel, FRAMEPOINT_TOPRIGHT, 0, PADDING);
        for (const player of game.players.values()) {
            close.setContent(player, {
                icon: 'ReplaceableTextures\\CommandButtons\\BTNCancel.blp',
                title: 'Close',
                description: 'Close the race selection',
            });
        }

        // Opening/closing is local UI; only the pick changes game state and is synced
        game.playerSync.on('race-pick', (player, itemId) => this.pick(player, itemId));

        this.showTier(this.selectedTier);
    }

    /**
     * Toggles the panel for the acting player. Runs on every client (button and -race fire
     * everywhere), but the panel is pure view, so only that player's own client does anything.
     */
    public toggle(player: Defender): void {
        if (!player.isLocal()) {
            return;
        }
        if (this.visibleLocally) {
            this.close(player);
        } else {
            this.open(player);
        }
    }

    /** Opens for a player (local visibility); used at game start and after repick. */
    public open(player: Defender): void {
        this.setVisible(player, true);
    }

    public close(player: Defender): void {
        this.setVisible(player, false);
    }

    /** Applies a pick sent from the panel; runs on every client. */
    private pick(player: Defender, itemId: string): void {
        if (player.isLocal()) {
            this.settlePick();
        }
        const item = RaceItems[itemId];
        const race: Race | undefined = this.game.worldMap.races.find(candidate => candidate.itemid === itemId);
        const isRandomPick = itemId === RANDOM_PICK_ITEMS.normal || itemId === RANDOM_PICK_ITEMS.hardcore
            || itemId === RANDOM_PICK_ITEMS.hybrid;
        // Debug builds may pick disabled / random-only races from the Dev tab
        if (!item || (!isRandomPick && !race?.enabled && !this.game.debugMode)) {
            return;
        }
        // A race is picked once; only the random picks can repeat
        if (race && !isRandomPick && player.hasRace(race)) {
            player.sendMessage(`You already have ${GetLocalizedString(item.name) ?? item.name}`);
            return;
        }
        // The shops charged for the item before the pick rules ran, and those rules refund
        // lumber on an invalid pick, so the same cost is charged here.
        if (player.getLumber() < item.lumberCost || player.getGold() < item.goldCost) {
            player.sendMessage('You have no race picks left');
            return;
        }
        player.giveLumber(-item.lumberCost);
        player.giveGold(-item.goldCost);
        this.game.worldMap.playerSpawns[player.lane].isOpen = true;
        this.game.racePicking.PickRaceForPlayerByItem(player, FourCC(itemId));
        if (player.races.length > 0 || player.hasHybridRandomed) {
            this.close(player);
        }
    }

    /** Local: the sent pick has been applied (or given up on); the button takes clicks again. */
    private settlePick(): void {
        this.pickInFlight = false;
        this.pickSettle.pause();
        this.refreshPickButton();
    }

    /** Local: Pick is available unless a pick is in flight or the local player already has the race. */
    private refreshPickButton(): void {
        const localPlayer = this.game.players.get(GetPlayerId(GetLocalPlayer()));
        const race = this.game.worldMap.races.find(candidate => candidate.itemid === this.highlightedItem);
        const owned = race !== undefined && localPlayer !== undefined && localPlayer.hasRace(race);
        this.pickButton.setEnabled(!this.pickInFlight && !owned);
        this.pickButton.setText(owned ? 'Picked' : 'Pick');
    }

    /** Local: fills the list with the races of a tier. */
    private showTier(tier: RaceTier): void {
        this.selectedTier = tier;
        for (const [buttonTier, button] of this.categoryButtons) {
            button.setEnabled(buttonTier !== tier);
        }
        if (tier === 'Dev') {
            // Every race with panel data that a normal tab does not show: disabled races and
            // the random-only Loot Boxer
            const normalTiers: RaceTier[] = ['Beginner', 'Intermediate', 'Advanced'];
            this.currentItems = this.game.worldMap.races
                .filter(race => RaceItems[race.itemid] !== undefined
                    && !(race.enabled && normalTiers.indexOf(RaceItems[race.itemid].tier) !== -1))
                .map(race => RaceItems[race.itemid]);
        } else {
            this.currentItems = this.game.worldMap.races
                .filter(race => race.enabled && RaceItems[race.itemid]?.tier === tier)
                .map(race => RaceItems[race.itemid]);
            if (tier === 'Random') {
                this.currentItems.push(RaceItems[RANDOM_PICK_ITEMS.normal], RaceItems[RANDOM_PICK_ITEMS.hardcore],
                    RaceItems[RANDOM_PICK_ITEMS.hybrid]);
            }
        }
        if (this.scrollbar) {
            this.scrollbar.setMinMaxValue(0, this.maxScroll());
            this.scrollbar.setVisible(this.maxScroll() > 0);
            // Slider at max = top of the list; the direct scrollTo(0) below does the scroll
            this.scrollbar.setValue(this.maxScroll());
        }
        this.scrollTo(0);
        this.highlight(this.currentItems[0]?.id);
    }

    private maxScroll(): number {
        return Math.max(0, this.currentItems.length - VISIBLE_ROWS);
    }

    /**
     * Local: scrolls one step and moves the slider to match. The scroll happens directly
     * rather than through the slider's value-changed event: that event arrives a frame later
     * without a reliable trigger player, so the gated handler may drop it. scrollTo is
     * idempotent and never writes the slider, so the late event is harmless either way.
     */
    private wheelScroll(up: boolean): void {
        const target = Math.max(0, Math.min(this.scrollOffset + (up ? -1 : 1), this.maxScroll()));
        this.scrollTo(target);
        this.scrollbar?.setValue(this.maxScroll() - target);
    }

    private scrollTo(offset: number): void {
        this.scrollOffset = Math.max(0, Math.min(offset, this.maxScroll()));
        this.rows.forEach((row, index) => {
            row.setItem(this.currentItems[this.scrollOffset + index]);
            row.setSelected(this.currentItems[this.scrollOffset + index]?.id === this.highlightedItem);
        });
    }

    /** Local: shows an item in the information pane and marks its row. */
    private highlight(itemId: string | undefined): void {
        const item = itemId !== undefined ? RaceItems[itemId] : undefined;
        this.highlightedItem = itemId;
        this.infoIcon.setTexture(item?.icon ?? '', 0, true);
        this.infoIcon.setVisible(item !== undefined);
        this.infoName.setText(item ? (GetLocalizedString(item.name) ?? item.name) : '');
        this.infoText.setText(item ? (GetLocalizedString(item.description) ?? item.description) : '');
        this.rows.forEach(row => row.setSelected(row.item === itemId));
        this.refreshPickButton();
    }

    private setVisible(player: Defender, visible: boolean): void {
        // Frames are shared, visibility is per client
        if (!player.isLocal()) {
            return;
        }
        this.visibleLocally = visible;
        this.panel.setVisible(visible);
    }
}
