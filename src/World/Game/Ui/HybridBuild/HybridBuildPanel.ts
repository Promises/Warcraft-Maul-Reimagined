import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../../Entity/Players/Defender';
import {IconButton} from '../IconButton';

// Layout: a 4x3 grid like the command card, sitting above the action bar. The console
// area itself never passes mouse input to custom frames, so the panel cannot overlay it.
const COLUMNS = 4;
const ROWS = 3;
const BUTTON_SIZE = 0.032;
const BUTTON_SPACING = 0.036;
const PANEL_PADDING = 0.008;
const PANEL_CENTER_X = 0.4;
const PANEL_BOTTOM_Y = 0.165;
const TIERS = 9;
const CANCEL_SLOT = COLUMNS * ROWS - 1;

/**
 * Tower picker for hybrid random players. Opening the panel and entering build mode are pure
 * local UI (frames, grid images and the ghost are per-client visuals), so they run instantly
 * with no sync round-trip; only placing a tower is synced, by Defender.
 */
export class HybridBuildPanel {
    private readonly panel: Frame;
    private readonly tierButtons: IconButton[] = [];
    private readonly cancelButton: IconButton;
    private visibleLocally: boolean = false;

    constructor(private readonly game: WarcraftMaul) {
        const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
        const width = COLUMNS * BUTTON_SPACING + PANEL_PADDING;
        const height = ROWS * BUTTON_SPACING + PANEL_PADDING;

        this.panel = Frame.createType('hybridBuildPanel', gameUi, 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
        this.panel.setSize(width, height);
        this.panel.setAbsPoint(FRAMEPOINT_BOTTOM, PANEL_CENTER_X, PANEL_BOTTOM_Y);

        const slotCenter = (slot: number): [number, number] => {
            const column = slot % COLUMNS;
            const row = Math.floor(slot / COLUMNS);
            return [
                PANEL_CENTER_X + (column - (COLUMNS - 1) / 2) * BUTTON_SPACING,
                PANEL_BOTTOM_Y + height - PANEL_PADDING / 2 - (row + 0.5) * BUTTON_SPACING,
            ];
        };

        // A closure per tier: a classic for loop would share one loop variable in the generated Lua
        for (const tier of Array.from({length: TIERS}, (_, index) => index)) {
            // Three towers per row; the right column is kept for cancel
            const slot = Math.floor(tier / (COLUMNS - 1)) * COLUMNS + tier % (COLUMNS - 1);
            const [x, y] = slotCenter(slot);
            this.tierButtons.push(new IconButton(game, `hybridBuildTier${tier}`, this.panel, x, y, BUTTON_SIZE,
                () => this.pickTowerLocal(tier)));
        }
        const [cancelX, cancelY] = slotCenter(CANCEL_SLOT);
        this.cancelButton = new IconButton(game, 'hybridBuildCancel', this.panel, cancelX, cancelY, BUTTON_SIZE,
            () => this.closeLocal());

        this.panel.setVisible(false);
    }

    /** Refreshes the local player's buttons after their towers were rolled. */
    public refresh(player: Defender): void {
        player.hybridTowers.forEach((tower, tier) => this.tierButtons[tier].setContent(player, {
            icon: tower.icon ?? '',
            title: tower.name,
            description: tower.toolTipExtended,
            goldCost: tower.goldCost,
        }));
        this.cancelButton.setContent(player, {
            icon: 'ReplaceableTextures\\CommandButtons\\BTNCancel.blp',
            title: 'Close',
            description: 'Close the build menu and stop building',
        });
    }

    /** Local toggle for the action bar button / -build; each client owns its panel. */
    public toggleLocal(): void {
        const player = this.game.players.get(GetPlayerId(GetLocalPlayer()));
        if (!player) {
            return;
        }
        if (this.visibleLocally) {
            this.closeLocal();
        } else {
            this.open(player);
        }
    }

    public open(player: Defender): void {
        if (!player.hasHybridRandomed) {
            player.sendMessage('The build menu is only available after hybrid randoming');
            return;
        }
        this.setVisible(player, true);
    }

    /** Closes the panel and leaves build mode; used by the cancel button, escape and after a build. */
    public close(player: Defender): void {
        player.stopBuilding();
        this.setVisible(player, false);
    }

    private closeLocal(): void {
        const player = this.game.players.get(GetPlayerId(GetLocalPlayer()));
        if (player) {
            this.close(player);
        }
    }

    private pickTowerLocal(tier: number): void {
        const player = this.game.players.get(GetPlayerId(GetLocalPlayer()));
        if (player && player.hybridTowers[tier]) {
            player.startBuilding(tier);
        }
    }

    private setVisible(player: Defender, visible: boolean): void {
        // Frames are shared, visibility is per client
        if (!player.isLocal()) {
            return;
        }
        this.visibleLocally = visible;
        this.panel.setVisible(visible);
        if (!visible) {
            player.pointerOverUi = false;
        }
    }
}
