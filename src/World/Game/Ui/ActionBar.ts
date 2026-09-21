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

// Design handoff "Action bar, full rail": the bar is a rail on the console ledge, anchored
// from the minimap's right edge to just past the inventory, so it follows the aspect ratio;
// 0.042 tall at 16:9 (y 0.131-0.173). Buttons are 0.026 on a 0.032 pitch, centred on the
// rail as one cluster: the five buttons, a divider, and two reserved wells.
const RAIL_LEFT_GAP = 0.006;
const RAIL_BOTTOM_OFFSET = -0.008;
const RAIL_RIGHT_GAP = 0.006;
const RAIL_TOP_OFFSET = 0.034;
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

    constructor(game: WarcraftMaul) {
        this.game = game;
        const gameUi = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
        const minimap = Frame.fromOrigin(ORIGIN_FRAME_MINIMAP, 0)!;
        // Item slot 1 is the top-right inventory slot
        const inventory = Frame.fromOrigin(ORIGIN_FRAME_ITEM_BUTTON, 1)!;

        // The game's recessed control backdrop (EscMenuTemplates, loaded through our TOC)
        this.rail = Frame.createType('actionbarRail', gameUi, 0, 'BACKDROP', 'EscMenuControlBackdropTemplate')!;
        this.rail.setPoint(FRAMEPOINT_BOTTOMLEFT, minimap, FRAMEPOINT_TOPRIGHT, RAIL_LEFT_GAP, RAIL_BOTTOM_OFFSET);
        this.rail.setPoint(FRAMEPOINT_TOPRIGHT, inventory, FRAMEPOINT_TOPRIGHT, RAIL_RIGHT_GAP, RAIL_TOP_OFFSET);

        this.initializeButtons();
    }

    private initializeButtons(): void {
        // Cluster layout in pitches, centred: buttons 0..4, divider, two wells
        const span = (BUTTON_COUNT + RESERVED_WELLS) * BUTTON_PITCH + 2 * DIVIDER_GAP;
        const first = -span / 2 + BUTTON_PITCH / 2;
        const offset = (index: number): number => first + index * BUTTON_PITCH + (index >= BUTTON_COUNT ? 2 * DIVIDER_GAP : 0);

        this.buttons.push(new ExampleMaze(this.game, this.rail, offset(0), BUTTON_SIZE, 0));
        this.buttons.push(new ClaimButton(this.game, this.rail, offset(1), BUTTON_SIZE, 1));
        this.buttons.push(new HybridBuildButton(this.game, this.rail, offset(2), BUTTON_SIZE, 2));
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
    }
}
