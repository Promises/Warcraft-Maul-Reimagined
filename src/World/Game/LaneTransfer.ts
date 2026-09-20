import {Unit} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {Tower} from '../Entity/Tower/Specs/Tower';
import {Walkable} from '../Antiblock/Maze';
import {COLOUR, DecodeFourCC, SendMessage, Util} from '../../lib/translators';
import {COLOUR_CODES} from '../GlobalSettings';
import {Log} from '../../lib/Serilog/Serilog';

const GRID = 64;

/** Tower centres sit on grid corners; snapping removes float error from the frame maths. */
function snapToGrid(value: number): number {
    return Math.floor(value / GRID + 0.5) * GRID;
}

/**
 * A lane's coordinate frame: origin at its first checkpoint, `along` pointing at the second
 * checkpoint and `across` perpendicular to it. This is the frame the sample holomaze is drawn
 * in (AdvancedHoloMaze), so a layout carried between lanes lands where the sample maze would.
 * The lanes are congruent - checkpoints 1152 apart, the area +-768 across and -640..+1792
 * along - so carrying a position between two frames is rigid and keeps the 64 grid.
 */
class LaneFrame {
    public readonly originX: number;
    public readonly originY: number;
    private readonly alongX: number;
    private readonly alongY: number;
    private readonly acrossX: number;
    private readonly acrossY: number;

    constructor(game: WarcraftMaul, lane: number) {
        const first = game.worldMap.playerSpawns[lane].spawnOne?.next;
        const second = first?.next;
        if (!first || !second) {
            throw new Error(`Lane ${lane} has no checkpoints`);
        }
        this.originX = GetRectCenterX(first.rectangle);
        this.originY = GetRectCenterY(first.rectangle);
        const dx = GetRectCenterX(second.rectangle) - this.originX;
        const dy = GetRectCenterY(second.rectangle) - this.originY;
        const length = Math.sqrt(dx * dx + dy * dy);
        this.alongX = dx / length;
        this.alongY = dy / length;
        // Same perpendicular as the holomaze, (-dy, -dx): horizontal lanes come out mirrored
        // rather than rotated, which is still the same maze, and matches the sample players saw
        this.acrossX = -this.alongY;
        this.acrossY = -this.alongX;
    }

    public toLocal(x: number, y: number): { along: number, across: number } {
        const dx = x - this.originX;
        const dy = y - this.originY;
        return {
            along: dx * this.alongX + dy * this.alongY,
            across: dx * this.acrossX + dy * this.acrossY,
        };
    }

    public fromLocal(along: number, across: number): { x: number, y: number } {
        return {
            x: this.originX + along * this.alongX + across * this.acrossX,
            y: this.originY + along * this.alongY + across * this.acrossY,
        };
    }
}

interface CarriedTower {
    typeId: number;
    name: string;
    value: number;
    fromX: number;
    fromY: number;
    x: number;
    y: number;
}

/**
 * Lets a player take over a lane nobody holds. The case that matters in play is gray: it is
 * the last stretch before the ship, so an empty gray lane leaks every creep. The player keeps
 * their colour; their area, spawn and last-defender bonus follow `Defender.lane`. Their towers
 * in their own lane are rebuilt at the same place in the new lane (through the lane frames
 * above), their builders walk over, and anything still standing in the new lane is sold to
 * its owner first.
 *
 * Runs from a chat command, which fires on every client, so everything here is synchronous
 * game state.
 */
export class LaneTransfer {
    constructor(private readonly game: WarcraftMaul) {
    }

    public moveToGray(player: Defender): void {
        this.moveToLane(player, COLOUR.GRAY);
    }

    public moveToLane(player: Defender, target: number): void {
        const laneName = Util.ColourString(COLOUR_CODES[target], Util.COLOUR_NAMES[target]);
        if (player.lane === target) {
            player.sendMessage(`You already hold the ${laneName} lane`);
            return;
        }
        for (const other of this.game.players.values()) {
            if (other.lane === target && other.slotState === PLAYER_SLOT_STATE_PLAYING) {
                player.sendMessage(`${other.getNameWithColour()} holds the ${laneName} lane`);
                return;
            }
        }
        if (this.game.worldMap.gameRoundHandler?.isWaveInProgress) {
            player.sendMessage(`Wait until the wave is over before moving to the ${laneName} lane`);
            return;
        }

        const from = new LaneFrame(this.game, player.lane);
        const to = new LaneFrame(this.game, target);
        const oldLane = player.lane;
        const oldArea = player.getArea();

        this.sellTowersIn(target);

        // Towers the player has in their own lane; towers built elsewhere stay where they are
        const carried: CarriedTower[] = [];
        for (const tower of player.towersArray.filter(candidate => oldArea.ContainsUnit(candidate.unit))) {
            const local = from.toLocal(tower.unit.x, tower.unit.y);
            const position = to.fromLocal(local.along, local.across);
            carried.push({
                typeId: tower.unit.typeId,
                name: tower.unit.name,
                value: tower.GetSellValue(),
                fromX: tower.unit.x,
                fromY: tower.unit.y,
                x: snapToGrid(position.x),
                y: snapToGrid(position.y),
            });
        }
        // Every tower is removed before any is rebuilt, so a rebuilt one cannot land on a
        // cell an old one still occupies; an error in one tower must not abandon the rest
        // half-moved, so each step is caught and logged
        for (const tower of player.towersArray.filter(candidate => oldArea.ContainsUnit(candidate.unit))) {
            try {
                this.removeTower(tower, oldLane);
            } catch (error) {
                Log.Error(`Removing ${tower.unit.name} at ${tower.unit.x}, ${tower.unit.y} failed: ${error}`);
            }
        }

        const spawns = this.game.worldMap.playerSpawns;
        spawns[target].isOpen = spawns[oldLane].isOpen;
        spawns[oldLane].isOpen = false;
        player.moveToLane(target);

        let rebuilt = 0;
        for (const tower of carried) {
            try {
                if (this.rebuildTower(player, tower, target)) {
                    rebuilt++;
                }
            } catch (error) {
                Log.Error(`Rebuilding ${tower.name} at ${tower.x}, ${tower.y} failed: ${error}`);
            }
        }

        // Builders walk over last, so none of them stands where a tower is about to be rebuilt
        for (const builder of this.builders(player)) {
            if (oldArea.ContainsUnit(builder)) {
                const local = from.toLocal(builder.x, builder.y);
                const position = to.fromLocal(local.along, local.across);
                builder.setPosition(position.x, position.y);
            }
        }

        PanCameraToTimedForPlayer(player.handle, player.getCenterX(), player.getCenterY(), 0.00);
        SendMessage(`${player.getNameWithColour()} moved into the ${laneName} lane`
            + (target === COLOUR.GRAY ? ' and is now the last defender' : ''));
        if (rebuilt < carried.length) {
            player.sendMessage(`${carried.length - rebuilt} of ${carried.length} towers had no room in the ${laneName} lane and were refunded`);
        }
        Log.Info(`${player.getPlayerName()} moved ${rebuilt}/${carried.length} towers from lane ${oldLane} to ${target}`);
    }

    /**
     * Debug: writes to the log every tower cell that is not buildable in a lane although it
     * is in most other lanes - the terrain differences that make a transfer refund towers.
     * Cells are given in lane-local terms (along/across the checkpoint frame, so lanes can
     * be compared) and as world coordinates of the tower centre for the World Editor.
     */
    public reportLaneDifferences(): void {
        const lanes = this.game.mapSettings.PLAYER_AREAS.length;
        const frames: LaneFrame[] = [];
        for (let lane = 0; lane < lanes; lane++) {
            frames.push(new LaneFrame(this.game, lane));
        }
        // Tower centres whose 2x2 footprint lies inside the area: along -640..1792, across +-768
        const alongs: number[] = [];
        for (let along = -640 + GRID; along <= 1792 - GRID; along += GRID) {
            alongs.push(along);
        }
        const acrosses: number[] = [];
        for (let across = -768 + GRID; across <= 768 - GRID; across += GRID) {
            acrosses.push(across);
        }
        const construction = this.game.worldMap.towerConstruction;
        const buildable: boolean[][][] = frames.map(frame => alongs.map(along => acrosses.map(across => {
            const point = frame.fromLocal(along, across);
            return construction.isBuildable(snapToGrid(point.x), snapToGrid(point.y));
        })));

        for (let lane = 0; lane < lanes; lane++) {
            let missing = 0;
            alongs.forEach((along, i) => {
                const cells: string[] = [];
                acrosses.forEach((across, j) => {
                    if (buildable[lane][i][j]) {
                        return;
                    }
                    const buildableElsewhere = buildable.filter((other, otherLane) => otherLane !== lane && other[i][j]).length;
                    if (buildableElsewhere > (lanes - 1) / 2) {
                        const point = frames[lane].fromLocal(along, across);
                        cells.push(`across ${across} (${snapToGrid(point.x)},${snapToGrid(point.y)})`);
                    }
                });
                if (cells.length > 0) {
                    missing += cells.length;
                    Log.Info(`Lane ${lane} ${Util.COLOUR_NAMES[lane]} along ${along}: not buildable at ${cells.join(', ')}`);
                }
            });
            Log.Info(`Lane ${lane} ${Util.COLOUR_NAMES[lane]}: ${missing} cells not buildable that other lanes have`);
        }
        Log.flush();
    }

    /** Sells every remaining tower in a lane to its owner, so the lane is clear to move into. */
    private sellTowersIn(lane: number): void {
        const rectangle: rect = this.game.mapSettings.PLAYER_AREAS[lane].toRect();
        const group = GetUnitsInRectAll(rectangle)!;
        ForGroupBJ(group, () => {
            const unit = Unit.fromEnum();
            if (unit && unit.isUnitType(UNIT_TYPE_STRUCTURE) && this.game.players.has(unit.owner.id)) {
                this.game.sellTower.SellTower(unit);
            }
        });
        DestroyGroup(group);
        RemoveRect(rectangle);
    }

    private removeTower(tower: Tower, lane: number): void {
        tower.Sell();
        this.game.worldMap.playerMazes[lane].setFootprint(tower.unit.x, tower.unit.y, Walkable.Walkable);
        tower.unit.destroy();
    }

    /**
     * Rebuilds a tower at its target cell, or refunds it in full when it cannot stand exactly
     * there: the lanes match in shape but not entirely in terrain (the last row of the gray
     * lane, by the ship, is not buildable).
     */
    private rebuildTower(player: Defender, tower: CarriedTower, lane: number): boolean {
        const unit = this.game.worldMap.towerConstruction.placeTower(player, tower.typeId, tower.x, tower.y);
        Log.Info(`Rebuild ${tower.name} (${DecodeFourCC(tower.typeId)}) ${tower.fromX},${tower.fromY} -> ${tower.x},${tower.y}`
            + (unit ? '' : ' has no room, refunded'));
        if (!unit) {
            player.giveGold(tower.value);
            return false;
        }
        return true;
    }

    private builders(player: Defender): Unit[] {
        const builders: Unit[] = player.builders.slice();
        for (const special of [player.hybridBuilder, player.getVoidBuilder(), player.getLootBoxer()]) {
            if (special) {
                builders.push(special);
            }
        }
        return builders;
    }
}
