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
// One hotkey per grid slot, the command card's layout: QWER / ASDF / ZXCV
export const HYBRID_BUILD_HOTKEYS: oskeytype[] = [
    OSKEY_Q, OSKEY_W, OSKEY_E, OSKEY_R,
    OSKEY_A, OSKEY_S, OSKEY_D, OSKEY_F,
    OSKEY_Z, OSKEY_X, OSKEY_C, OSKEY_V,
];
const HOTKEY_LABELS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];

/** The grid slot of a tier: three towers per row, the right column is kept for cancel. */
function slotOfTier(tier: number): number {
    return Math.floor(tier / (COLUMNS - 1)) * COLUMNS + tier % (COLUMNS - 1);
}

/**
 * Tower picker for hybrid random players. Its click, chat and key events all fire on every
 * client with the acting player, so open/close/pick run everywhere for that player: build
 * mode creates handles (mouse triggers, the ghost effect) that must stay in step across
 * clients. Only the panel frame's visibility is per client, gated to the local player.
 * Placing a tower stays synced by Defender.
 */
export class HybridBuildPanel {
    private readonly panel: Frame;
    private readonly tierButtons: IconButton[] = [];
    private readonly cancelButton: IconButton;
    // Per player, updated on every client so toggle decisions agree everywhere
    private readonly openFor: boolean[] = [];

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
            const [x, y] = slotCenter(slotOfTier(tier));
            this.tierButtons.push(new IconButton(game, `hybridBuildTier${tier}`, this.panel, x, y, BUTTON_SIZE,
                player => this.pick(player, tier)));
        }
        const [cancelX, cancelY] = slotCenter(CANCEL_SLOT);
        this.cancelButton = new IconButton(game, 'hybridBuildCancel', this.panel, cancelX, cancelY, BUTTON_SIZE,
            player => this.close(player));

        this.panel.setVisible(false);
    }

    /** Refreshes the local player's buttons after their towers were rolled. */
    public refresh(player: Defender): void {
        player.hybridTowers.forEach((tower, tier) => this.tierButtons[tier].setContent(player, {
            icon: tower.icon ?? '',
            title: `|cffffcc00${HOTKEY_LABELS[slotOfTier(tier)]}|r  ${tower.name}`,
            description: tower.toolTipExtended,
            goldCost: tower.goldCost,
        }));
        this.cancelButton.setContent(player, {
            icon: 'ReplaceableTextures\\CommandButtons\\BTNCancel.blp',
            title: `|cffffcc00${HOTKEY_LABELS[CANCEL_SLOT]}|r  Close`,
            description: 'Close the build menu and stop building (Escape)',
        });
    }

    /**
     * A hotkey press while the panel is open: the slot's tower enters build mode, V closes.
     * Key events are synced player events, so this runs on every client like a click.
     */
    public hotkey(player: Defender, slot: number): void {
        if (!this.openFor[player.id]) {
            return;
        }
        if (slot === CANCEL_SLOT) {
            this.close(player);
            return;
        }
        const row = Math.floor(slot / COLUMNS);
        const column = slot % COLUMNS;
        if (column < COLUMNS - 1) {
            this.pick(player, row * (COLUMNS - 1) + column);
        }
    }

    /** Toggles the panel for the acting player; runs on every client (button and -build). */
    public toggle(player: Defender): void {
        if (this.openFor[player.id]) {
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
        this.openFor[player.id] = true;
        this.showTiers(player, undefined);
        this.setVisible(player, true);
    }

    /** Closes the panel and leaves build mode; used by the cancel button, escape and after a build. */
    public close(player: Defender): void {
        this.openFor[player.id] = false;
        player.stopBuilding();
        this.setVisible(player, false);
    }

    /** Enters build mode for a tier; the panel then shows only that tower (and Close). */
    private pick(player: Defender, tier: number): void {
        if (this.openFor[player.id] && player.hybridTowers[tier]) {
            player.startBuilding(tier);
            this.showTiers(player, tier);
        }
    }

    /** Local view: all tiers, or a single one while it is being placed. */
    private showTiers(player: Defender, only: number | undefined): void {
        if (!player.isLocal()) {
            return;
        }
        this.tierButtons.forEach((button, tier) => button.setVisible(only === undefined || tier === only));
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
