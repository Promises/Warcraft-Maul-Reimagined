/**
 * All credits to Runi95 for 99% of the work of these modules
 */

import { AbstractActionButton } from './Buttons/AbstractActionButton';
import { WarcraftMaul } from '../../WarcraftMaul';
import { ExampleMaze } from './Buttons/ExampleMaze';
import { ClaimButton } from './Buttons/ClaimButton';
import { HybridBuildButton } from './Buttons/HybridBuildButton';
import { RaceSelectButton } from './Buttons/RaceSelectButton';
import { RangeCheckButton } from './Buttons/RangeCheckButton';
import {Frame} from "w3ts";
import {Defender} from '../../Entity/Players/Defender';

// Design handoff "Action bar, full rail": a rail on the console ledge, 0.042 tall, holding
// the buttons at 0.026 on a 0.032 pitch as one cluster: the five buttons, a divider, and
// two reserved wells. The rail is sized to the cluster plus padding and centred above the
// console (anchoring it to the minimap and inventory frames collapsed it to a line).
const RAIL_CENTER_X = 0.4;
const RAIL_CENTER_Y = 0.16;
const RAIL_HEIGHT = 0.042;
const RAIL_PADDING = 0.012;
const BUTTON_SIZE = 0.026;
const BUTTON_PITCH = 0.032;
const BUTTON_COUNT = 5;
const RESERVED_WELLS = 2;
// Extra room either side of the divider
const DIVIDER_GAP = 0.006;
const WELL_TEXTURE = 'uiImport\\CommandButtons\\frame-icon.dds';
const DIVIDER_TEXTURE = 'Textures\\White.blp';

export class ActionBar {
    private readonly game: WarcraftMaul;
    private readonly rail: Frame;
    private readonly buttons: AbstractActionButton[] = [];
    private readonly hybridBuild: HybridBuildButton;

    constructor(game: WarcraftMaul) {
        this.game = game;
        const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;

        // The game's recessed control backdrop (EscMenuTemplates, loaded through our TOC)
        this.rail = Frame.createType('actionbarRail', gameUi, 0, 'BACKDROP', 'EscMenuControlBackdropTemplate')!;
        this.rail.setSize(ActionBar.clusterSpan() + 2 * RAIL_PADDING, RAIL_HEIGHT);
        this.rail.setAbsPoint(FRAMEPOINT_CENTER, RAIL_CENTER_X, RAIL_CENTER_Y);

        this.hybridBuild = this.initializeButtons();
        // Only a hybrid random player has a build menu; the button appears when they random
        this.hybridBuild.setVisible(false);
    }

    /** Debug: hides this bar; -flick builds a new one in a variant. */
    public hide(): void {
        this.rail.setVisible(false);
    }

    /** Shows the hybrid build button on that player's client. */
    public showHybridBuild(player: Defender): void {
        if (player.isLocal()) {
            this.hybridBuild.setVisible(true);
        }
    }

    /** Width of the button cluster: the buttons, the divider's room, the reserved wells. */
    private static clusterSpan(): number {
        return (BUTTON_COUNT + RESERVED_WELLS) * BUTTON_PITCH + 2 * DIVIDER_GAP;
    }

    private initializeButtons(): HybridBuildButton {
        // Cluster layout in pitches, centred: buttons 0..4, divider, two wells
        const span = ActionBar.clusterSpan();
        const first = -span / 2 + BUTTON_PITCH / 2;
        const offset = (index: number): number => first + index * BUTTON_PITCH + (index >= BUTTON_COUNT ? 2 * DIVIDER_GAP : 0);

        this.buttons.push(new ExampleMaze(this.game, this.rail, offset(0), BUTTON_SIZE, 0));
        this.buttons.push(new ClaimButton(this.game, this.rail, offset(1), BUTTON_SIZE, 1));
        const hybridBuild = new HybridBuildButton(this.game, this.rail, offset(2), BUTTON_SIZE, 2);
        this.buttons.push(hybridBuild);
        this.buttons.push(new RaceSelectButton(this.game, this.rail, offset(3), BUTTON_SIZE, 3));
        this.buttons.push(new RangeCheckButton(this.game, this.rail, offset(4), BUTTON_SIZE, 4));

        const divider = Frame.createType('actionbarDivider', this.rail, 0, 'BACKDROP', '')!;
        divider.setSize(0.001, BUTTON_SIZE);
        divider.setPoint(FRAMEPOINT_CENTER, this.rail, FRAMEPOINT_CENTER,
            first + BUTTON_COUNT * BUTTON_PITCH - BUTTON_PITCH / 2 + DIVIDER_GAP, 0);
        divider.setTexture(DIVIDER_TEXTURE, 0, true);
        divider.setAlpha(110);

        // Reserved wells: empty frames, dimmed, where the next buttons go
        for (let i = 0; i < RESERVED_WELLS; i++) {
            const well = Frame.createType(`actionbarReserved${i}`, this.rail, 0, 'BACKDROP', '')!;
            well.setSize(BUTTON_SIZE, BUTTON_SIZE);
            well.setPoint(FRAMEPOINT_CENTER, this.rail, FRAMEPOINT_CENTER, offset(BUTTON_COUNT + i), 0);
            well.setTexture(WELL_TEXTURE, 0, true);
            well.setAlpha(107);
        }
        return hybridBuild;
    }
}
