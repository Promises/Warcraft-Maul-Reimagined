import {Frame, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../../Entity/Players/Defender';
import {Race} from '../../Races/Race';
import {RaceItemDef, RaceItems, RANDOM_PICK_ITEMS} from '../../Races/RaceItems';
import {IconButton} from '../IconButton';
import {trackHover} from '../UiHover';

// Layout in screen coordinates (0..0.8 wide, 0..0.6 high)
const PANEL_CENTER_X = 0.4;
const PANEL_CENTER_Y = 0.34;
const PANEL_WIDTH = 0.46;
const PANEL_HEIGHT = 0.31;
const PADDING = 0.012;

const GRID_COLUMNS = 6;
const GRID_ROWS = 6;
const GRID_BUTTON = 0.028;
const GRID_SPACING = 0.031;

const DETAILS_WIDTH = PANEL_WIDTH - 2 * PADDING - GRID_COLUMNS * GRID_SPACING - PADDING;
const DETAILS_ICON = 0.05;
const PICK_BUTTON_WIDTH = 0.1;
const PICK_BUTTON_HEIGHT = 0.03;
const CLOSE_BUTTON = 0.022;

/**
 * Race selection replacing the race shops: a grid of every playable race, a details pane
 * for the highlighted one, and the three random picks. Highlighting is local; picking sends
 * a sync message so the choice is applied on every client through RacePicking.
 */
export class RaceSelectPanel {
    private readonly panel: Frame;
    private readonly detailsIcon: Frame;
    private readonly detailsName: Frame;
    private readonly detailsText: Frame;
    private readonly pickButton: Frame;
    private readonly openFor: Set<number> = new Set<number>();
    /** Item highlighted in the details pane. Only meaningful on the local client. */
    private highlightedItem: string | undefined;

    constructor(private readonly game: WarcraftMaul) {
        const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
        const left = PANEL_CENTER_X - PANEL_WIDTH / 2;
        const top = PANEL_CENTER_Y + PANEL_HEIGHT / 2;

        this.panel = Frame.createType('raceSelectPanel', gameUi, 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
        this.panel.setSize(PANEL_WIDTH, PANEL_HEIGHT);
        this.panel.setAbsPoint(FRAMEPOINT_CENTER, PANEL_CENTER_X, PANEL_CENTER_Y);
        trackHover(game, this.panel);

        // Race grid
        const races = game.worldMap.races.filter(race => race.enabled && RaceItems[race.itemid] !== undefined);
        races.forEach((race, index) => {
            const column = index % GRID_COLUMNS;
            const row = Math.floor(index / GRID_COLUMNS);
            if (row >= GRID_ROWS) {
                return;
            }
            const x = left + PADDING + (column + 0.5) * GRID_SPACING;
            const y = top - PADDING - (row + 0.5) * GRID_SPACING;
            this.createItemButton(`raceSelect${index}`, race.itemid, x, y, GRID_BUTTON,
                () => this.highlight(race.itemid));
        });

        // Random picks under the grid
        const randomY = top - PADDING - GRID_ROWS * GRID_SPACING - PADDING - GRID_BUTTON / 2;
        const randomLabel = Frame.createType('raceSelectRandomLabel', this.panel, 0, 'TEXT', '')!;
        randomLabel.setText('Random:');
        randomLabel.setSize(0.06, GRID_BUTTON);
        randomLabel.setAbsPoint(FRAMEPOINT_LEFT, left + PADDING, randomY);
        [RANDOM_PICK_ITEMS.normal, RANDOM_PICK_ITEMS.hardcore, RANDOM_PICK_ITEMS.hybrid].forEach((itemId, index) => {
            const x = left + PADDING + 0.06 + (index + 0.5) * GRID_SPACING;
            this.createItemButton(`raceSelectRandom${index}`, itemId, x, randomY, GRID_BUTTON,
                () => game.playerSync.send('race-pick', itemId));
        });

        // Details pane
        const detailsLeft = left + PADDING + GRID_COLUMNS * GRID_SPACING + PADDING;
        this.detailsIcon = Frame.createType('raceSelectDetailsIcon', this.panel, 0, 'BACKDROP', '')!;
        this.detailsIcon.setSize(DETAILS_ICON, DETAILS_ICON);
        this.detailsIcon.setAbsPoint(FRAMEPOINT_TOPLEFT, detailsLeft, top - PADDING);
        this.detailsName = Frame.createType('raceSelectDetailsName', this.panel, 0, 'TEXT', '')!;
        this.detailsName.setSize(DETAILS_WIDTH - DETAILS_ICON - 0.006, DETAILS_ICON);
        this.detailsName.setAbsPoint(FRAMEPOINT_TOPLEFT, detailsLeft + DETAILS_ICON + 0.006, top - PADDING);
        this.detailsText = Frame.createType('raceSelectDetailsText', this.panel, 0, 'TEXT', '')!;
        this.detailsText.setSize(DETAILS_WIDTH, PANEL_HEIGHT - 2 * PADDING - DETAILS_ICON - PICK_BUTTON_HEIGHT - 0.02);
        this.detailsText.setAbsPoint(FRAMEPOINT_TOPLEFT, detailsLeft, top - PADDING - DETAILS_ICON - 0.008);

        // CustomTextButton comes from war3mapImported\ui\CustomTextButton.fdf
        this.pickButton = Frame.create('CustomTextButton', this.panel, 0, 0)!;
        this.pickButton.setSize(PICK_BUTTON_WIDTH, PICK_BUTTON_HEIGHT);
        this.pickButton.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, left + PANEL_WIDTH - PADDING, PANEL_CENTER_Y - PANEL_HEIGHT / 2 + PADDING);
        this.pickButton.setText('Pick race');
        const pickTrigger = Trigger.create();
        pickTrigger.triggerRegisterFrameEvent(this.pickButton, FRAMEEVENT_CONTROL_CLICK);
        pickTrigger.addAction(() => {
            this.pickButton.setEnabled(false);
            this.pickButton.setEnabled(true);
            if (this.highlightedItem !== undefined) {
                game.playerSync.send('race-pick', this.highlightedItem);
            }
        });
        trackHover(game, this.pickButton);

        const close = new IconButton(game, 'raceSelectClose', this.panel,
            left + PANEL_WIDTH - PADDING - CLOSE_BUTTON / 2, top - PADDING - CLOSE_BUTTON / 2, CLOSE_BUTTON,
            () => game.playerSync.send('race-close'));
        for (const player of game.players.values()) {
            close.setContent(player, {
                icon: 'ReplaceableTextures\\CommandButtons\\BTNCancel.blp',
                title: 'Close',
                description: 'Close the race selection. Reopen it from the action bar or with -race.',
            });
        }

        game.playerSync.on('race-toggle', player => this.toggle(player));
        game.playerSync.on('race-close', player => this.close(player));
        game.playerSync.on('race-pick', (player, itemId) => this.pick(player, itemId));

        this.panel.setVisible(false);
    }

    public toggle(player: Defender): void {
        if (this.openFor.has(player.id)) {
            this.close(player);
        } else {
            this.open(player);
        }
    }

    public open(player: Defender): void {
        this.openFor.add(player.id);
        this.setVisible(player, true);
    }

    public close(player: Defender): void {
        this.openFor.delete(player.id);
        this.setVisible(player, false);
    }

    /** Applies a pick sent from the panel; runs on every client. */
    private pick(player: Defender, itemId: string): void {
        const item = RaceItems[itemId];
        const race: Race | undefined = this.game.worldMap.races.find(candidate => candidate.itemid === itemId);
        const isRandomPick = itemId === RANDOM_PICK_ITEMS.normal || itemId === RANDOM_PICK_ITEMS.hardcore
            || itemId === RANDOM_PICK_ITEMS.hybrid;
        if (!item || !this.openFor.has(player.id) || (!isRandomPick && !race?.enabled)) {
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
        this.game.worldMap.playerSpawns[player.id].isOpen = true;
        this.game.racePicking.PickRaceForPlayerByItem(player, FourCC(itemId));
        if (player.races.length > 0 || player.hasHybridRandomed) {
            this.close(player);
        }
    }

    private createItemButton(name: string, itemId: string, x: number, y: number, size: number, onClick: () => void): void {
        const item: RaceItemDef = RaceItems[itemId];
        const button = new IconButton(this.game, name, this.panel, x, y, size, onClick);
        for (const player of this.game.players.values()) {
            button.setContent(player, {icon: item.icon, title: item.name, description: item.description});
        }
    }

    /** Local: shows an item in the details pane. */
    private highlight(itemId: string): void {
        const item = RaceItems[itemId];
        this.highlightedItem = itemId;
        this.detailsIcon.setTexture(item.icon, 0, true);
        this.detailsName.setText(GetLocalizedString(item.name) ?? item.name);
        this.detailsText.setText(GetLocalizedString(item.description) ?? item.description);
    }

    private setVisible(player: Defender, visible: boolean): void {
        // Frames are shared, visibility is per client
        if (!player.isLocal()) {
            return;
        }
        this.panel.setVisible(visible);
        if (!visible) {
            player.pointerOverUi = false;
        }
    }
}
