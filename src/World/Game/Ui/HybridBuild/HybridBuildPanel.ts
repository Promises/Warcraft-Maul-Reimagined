import {Frame} from 'w3ts';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../../Entity/Players/Defender';
import {IconButton} from '../IconButton';
import {Timer} from 'w3ts';
import {createPanel} from '../Frames';

// Layout: a 4x3 grid like the command card, on the right just above it, where a builder's build
// menu would be. The console area itself never passes mouse input to custom frames, so the panel
// cannot overlay it.
const COLUMNS = 4;
const ROWS = 3;
const BUTTON_SIZE = 0.032;
const BUTTON_SPACING = 0.036;
const PANEL_PADDING = 0.008;
// The right edge of the 4:3 screen, where the command card ends
const PANEL_RIGHT_X = 0.8;
const PANEL_BOTTOM_Y = 0.19;
const TIERS = 9;
const CANCEL_SLOT = COLUMNS * ROWS - 1;
// Top of the right column: keeps the menu open while building
const KEEP_OPEN_SLOT = COLUMNS - 1;
// One hotkey per tower slot, the command card's layout: QWER / ASDF / ZXC; the last slot is
// Close, which is Escape rather than V
export const HYBRID_BUILD_HOTKEYS: oskeytype[] = [
    OSKEY_Q, OSKEY_W, OSKEY_E, OSKEY_R,
    OSKEY_A, OSKEY_S, OSKEY_D, OSKEY_F,
    OSKEY_Z, OSKEY_X, OSKEY_C,
];
const HOTKEY_LABELS = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'Esc'];

/** The grid slot of a tier: three towers per row, the right column is kept for keep-open and close. */
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
    /**
     * Whether the menu has its Keep open button (R): with it on, the menu stays open while the
     * player builds. Off, the slot is empty and the menu closes on a pick, as it always did.
     */
    public static readonly KEEP_OPEN_BUTTON: boolean = false;

    private readonly panel: Frame;
    private readonly tierButtons: IconButton[] = [];
    private readonly cancelButton: IconButton;
    private readonly keepOpenButton: IconButton | undefined;
    // Per player, updated on every client so toggle decisions agree everywhere
    private readonly openFor: boolean[] = [];
    // Per player as well: the menu stays open while they build, until they close it
    private readonly keepOpen: boolean[] = [];

    constructor(private readonly game: WarcraftMaul) {
        const width = COLUMNS * BUTTON_SPACING + PANEL_PADDING;
        const height = ROWS * BUTTON_SPACING + PANEL_PADDING;

        this.panel = createPanel('hybridBuildPanel', width, height);
        this.panel.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, PANEL_RIGHT_X, PANEL_BOTTOM_Y);

        // Grid slots centred on a BUTTON_SPACING pitch, from the panel's top-left
        const place = (button: IconButton, slot: number): void => {
            button.frame.setPoint(FRAMEPOINT_CENTER, this.panel, FRAMEPOINT_TOPLEFT,
                PANEL_PADDING / 2 + (slot % COLUMNS + 0.5) * BUTTON_SPACING,
                -PANEL_PADDING / 2 - (Math.floor(slot / COLUMNS) + 0.5) * BUTTON_SPACING);
        };

        // A closure per tier: a classic for loop would share one loop variable in the generated Lua
        for (const tier of Array.from({length: TIERS}, (_, index) => index)) {
            const button = new IconButton(game, `hybridBuildTier${tier}`, this.panel, BUTTON_SIZE,
                player => this.pick(player, tier));
            place(button, slotOfTier(tier));
            button.setHotkey(HOTKEY_LABELS[slotOfTier(tier)]);
            this.tierButtons.push(button);
        }
        this.cancelButton = new IconButton(game, 'hybridBuildCancel', this.panel, BUTTON_SIZE,
            player => this.close(player));
        place(this.cancelButton, CANCEL_SLOT);
        this.cancelButton.setHotkey(HOTKEY_LABELS[CANCEL_SLOT]);
        if (HybridBuildPanel.KEEP_OPEN_BUTTON) {
            this.keepOpenButton = new IconButton(game, 'hybridBuildKeepOpen', this.panel, BUTTON_SIZE,
                player => this.toggleKeepOpen(player));
            place(this.keepOpenButton, KEEP_OPEN_SLOT);
            this.keepOpenButton.setHotkey(HOTKEY_LABELS[KEEP_OPEN_SLOT]);
        }

        // Gold changes all the time (kills, wave rewards); keep the dimming current while open.
        // Runs on every client and only touches the local player's view.
        Timer.create().start(0.5, true, () => {
            for (const player of game.players.values()) {
                if (this.openFor[player.id]) {
                    this.refreshAffordable(player);
                }
            }
        });
    }

    /** Local view: towers the player cannot pay for right now are dimmed. */
    private refreshAffordable(player: Defender): void {
        if (!player.isLocal()) {
            return;
        }
        const gold = player.getGold();
        player.hybridTowers.forEach((tower, tier) => this.tierButtons[tier].setDimmed(player, tower.goldCost > gold));
    }

    /** Refreshes the local player's buttons after their towers were rolled. */
    public refresh(player: Defender): void {
        player.hybridTowers.forEach((tower, tier) => this.tierButtons[tier].setContent(player, {
            icon: tower.icon ?? '',
            // The name is a string-table key; resolved here, since the hotkey prefix would stop the button doing it
            title: `|cffffcc00${HOTKEY_LABELS[slotOfTier(tier)]}|r  ${GetLocalizedString(tower.name) ?? tower.name}`,
            description: tower.toolTipExtended,
            goldCost: tower.goldCost,
        }));
        this.cancelButton.setContent(player, {
            icon: 'ReplaceableTextures\\CommandButtons\\BTNCancel.blp',
            title: `|cffffcc00${HOTKEY_LABELS[CANCEL_SLOT]}|r  Close`,
            description: 'Close the build menu and stop building',
        });
        this.refreshKeepOpen(player);
    }

    /** Local view: the keep-open button is lit while it is on. */
    private refreshKeepOpen(player: Defender): void {
        if (this.keepOpenButton === undefined) {
            return;
        }
        const on = this.keepOpen[player.id] === true;
        this.keepOpenButton.setContent(player, {
            icon: 'ReplaceableTextures\\CommandButtons\\BTNHoldPosition.blp',
            title: `|cffffcc00${HOTKEY_LABELS[KEEP_OPEN_SLOT]}|r  Keep open: ${on ? '|cff00ff00on|r' : 'off'}`,
            description: 'Keeps the build menu open while you build, so you can pick tower after tower. '
                + 'Close it with Escape or Close.',
        });
        this.keepOpenButton.setDimmed(player, !on);
    }

    /** Turns keep-open on or off for the acting player; runs on every client (click or hotkey). */
    private toggleKeepOpen(player: Defender): void {
        if (this.keepOpenButton === undefined) {
            return;
        }
        this.keepOpen[player.id] = this.keepOpen[player.id] !== true;
        this.refreshKeepOpen(player);
    }

    /**
     * A hotkey press while the panel is open: the slot's tower enters build mode (Escape
     * closes, registered by Defender). Key events are synced player events, so this runs on
     * every client like a click.
     */
    public hotkey(player: Defender, slot: number): void {
        if (!this.openFor[player.id]) {
            return;
        }
        const row = Math.floor(slot / COLUMNS);
        const column = slot % COLUMNS;
        if (column < COLUMNS - 1) {
            this.pick(player, row * (COLUMNS - 1) + column);
        } else if (slot === KEEP_OPEN_SLOT) {
            this.toggleKeepOpen(player);
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
        this.refreshAffordable(player);
        this.setVisible(player, true);
    }

    /** Closes the panel and leaves build mode; used by the cancel button, escape and after a build (built). */
    public close(player: Defender): void {
        this.openFor[player.id] = false;
        player.stopBuilding();
        this.setVisible(player, false);
    }

    /**
     * A tower was placed without shift (Defender keeps build mode for a shift-placement): build
     * mode ends, and the menu closes unless it is kept open.
     */
    public built(player: Defender): void {
        if (this.keepOpen[player.id] === true) {
            player.stopBuilding();
        } else {
            this.close(player);
        }
    }

    /**
     * Enters build mode for a tier and closes the menu, unless it is kept open; build mode
     * carries on until the tower is placed (shift keeps placing) or Escape ends it. B reopens
     * the menu to switch tower, or with the menu kept open, another tower's button or key.
     */
    private pick(player: Defender, tier: number): void {
        if (this.openFor[player.id] && player.hybridTowers[tier]) {
            player.startBuilding(tier);
            if (this.keepOpen[player.id] !== true) {
                this.openFor[player.id] = false;
                this.setVisible(player, false);
            }
        }
    }

    private setVisible(player: Defender, visible: boolean): void {
        // Frames are shared, visibility is per client
        if (!player.isLocal()) {
            return;
        }
        this.panel.setVisible(visible);
    }
}
