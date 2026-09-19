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
 * Tower picker for hybrid random players. Picking a tower enters build mode; placement
 * itself is handled by Defender. Button clicks are local frame events, so they only send
 * sync messages; open/close/pick run on every client through PlayerSync.
 */
export class HybridBuildPanel {
    private readonly panel: Frame;
    private readonly tierButtons: IconButton[] = [];
    private readonly cancelButton: IconButton;
    private readonly openFor: Set<number> = new Set<number>();

    constructor(game: WarcraftMaul) {
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
                () => game.playerSync.send('hybrid-pick', `${tier}`)));
        }
        const [cancelX, cancelY] = slotCenter(CANCEL_SLOT);
        this.cancelButton = new IconButton(game, 'hybridBuildCancel', this.panel, cancelX, cancelY, BUTTON_SIZE,
            () => game.playerSync.send('hybrid-close'));

        game.playerSync.on('hybrid-toggle', player => this.toggle(player));
        game.playerSync.on('hybrid-close', player => this.close(player));
        game.playerSync.on('hybrid-pick', (player, data) => this.pickTower(player, Number(data)));

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

    public toggle(player: Defender): void {
        if (this.openFor.has(player.id)) {
            this.close(player);
        } else {
            this.open(player);
        }
    }

    public open(player: Defender): void {
        if (!player.hasHybridRandomed) {
            player.sendMessage('The build menu is only available after hybrid randoming');
            return;
        }
        this.openFor.add(player.id);
        this.setVisible(player, true);
    }

    public close(player: Defender): void {
        this.openFor.delete(player.id);
        player.stopBuilding();
        this.setVisible(player, false);
    }

    private pickTower(player: Defender, tier: number): void {
        if (this.openFor.has(player.id) && player.hybridTowers[tier]) {
            player.startBuilding(tier);
        }
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
