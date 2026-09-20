import {Timer, Unit} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {Tower} from '../Entity/Tower/Specs/Tower';
import {Walkable} from '../Antiblock/Maze';
import {COLOUR, SendMessage, Util} from '../../lib/translators';
import {COLOUR_CODES} from '../GlobalSettings';
import {Log} from '../../lib/Serilog/Serilog';
import {Rectangle} from '../../JassOverrides/Rectangle';

const GRID = 64;
// Any standard item works as a pathing probe; it exists for a single tick and is never seen
const PROBE_ITEM = FourCC('ches');

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
    tower: Tower;
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
        const holder = this.game.laneHolders.get(target);
        if (holder) {
            player.sendMessage(`${holder.getNameWithColour()} holds the ${laneName} lane`);
            return;
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

        // Towers the player has in their own lane; towers built elsewhere stay where they are.
        // Old and new lane are disjoint areas, so each tower can move straight to its cell.
        const carried: CarriedTower[] = [];
        for (const tower of player.towersArray.filter(candidate => oldArea.ContainsUnit(candidate.unit))) {
            const local = from.toLocal(tower.unit.x, tower.unit.y);
            const position = to.fromLocal(local.along, local.across);
            carried.push({
                tower,
                typeId: tower.unit.typeId,
                name: tower.unit.name,
                value: tower.GetSellValue(),
                fromX: tower.unit.x,
                fromY: tower.unit.y,
                x: snapToGrid(position.x),
                y: snapToGrid(position.y),
            });
        }

        const spawns = this.game.worldMap.playerSpawns;
        spawns[target].isOpen = spawns[oldLane].isOpen;
        spawns[oldLane].isOpen = false;
        player.moveToLane(target);

        // Validates the pathing probe itself: a standing tower's own footprint must read blocked
        if (carried.length > 0) {
            const first = carried[0];
            Log.Info(`Probe: ${first.name} standing at ${first.fromX},${first.fromY} blocks walking: ${this.footprintBlocked(first.fromX, first.fromY)}`);
        }

        // An error in one tower must not abandon the rest half-moved
        const moved: CarriedTower[] = [];
        for (const tower of carried) {
            try {
                if (this.moveTower(player, tower, oldLane, target)) {
                    moved.push(tower);
                }
            } catch (error) {
                Log.Error(`Moving ${tower.name} to ${tower.x}, ${tower.y} failed: ${error}`);
            }
        }
        // The pathing map may only reflect a moved building on a later tick, so the moves are
        // verified after a short delay; a tower whose footprint still does not block is rebuilt
        Timer.create().start(0.10, false, () => this.verifyMoves(player, moved, target, carried.length, laneName));

        // Every other unit of the player in the old lane comes along: builders, and the units
        // some towers spawn or summon. Towers were moved first, so nothing lands on their cells
        // before they stand there.
        this.moveUnits(player, oldArea, from, to);

        PanCameraToTimedForPlayer(player.handle, player.getCenterX(), player.getCenterY(), 0.00);
        SendMessage(`${player.getNameWithColour()} moved into the ${laneName} lane`
            + (target === COLOUR.GRAY ? ' and is now the last defender' : ''));
        Log.Info(`${player.getPlayerName()} moved ${moved.length}/${carried.length} towers from lane ${oldLane} to ${target}`);
    }

    private verifyMoves(player: Defender, moved: CarriedTower[], lane: number, total: number, laneName: string): void {
        let standing = 0;
        let rebuilt = 0;
        for (const tower of moved) {
            if (this.footprintBlocked(tower.x, tower.y)) {
                standing++;
                continue;
            }
            Log.Error(`${tower.name} at ${tower.x},${tower.y}: pathing did not follow the move; rebuilding`);
            if (this.rebuildTower(player, tower, lane)) {
                rebuilt++;
            }
        }
        const refunded = total - standing - rebuilt;
        if (refunded > 0) {
            player.sendMessage(`${refunded} of ${total} towers had no room in the ${laneName} lane and were refunded`);
        }
        Log.Info(`Verified: ${standing} moved intact, ${rebuilt} rebuilt, ${refunded} refunded`);
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
            // One cell per line: the log sink truncates long lines
            alongs.forEach((along, i) => {
                acrosses.forEach((across, j) => {
                    if (buildable[lane][i][j]) {
                        return;
                    }
                    const buildableElsewhere = buildable.filter((other, otherLane) => otherLane !== lane && other[i][j]).length;
                    if (buildableElsewhere > (lanes - 1) / 2) {
                        const point = frames[lane].fromLocal(along, across);
                        missing++;
                        Log.Info(`Lane ${lane} ${Util.COLOUR_NAMES[lane]} along ${along} across ${across}: not buildable at ${snapToGrid(point.x)},${snapToGrid(point.y)}`);
                    }
                });
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

    /**
     * Moves a standing tower to its cell in the new lane, keeping the unit and everything
     * on it. When the cell is not buildable (the lanes match in shape, not entirely in
     * terrain) or the unit did not land there, the tower is rebuilt from scratch at the
     * target, and refunded in full if even that has no room.
     */
    private moveTower(player: Defender, carried: CarriedTower, oldLane: number, lane: number): boolean {
        const mazes = this.game.worldMap.playerMazes;
        mazes[oldLane].setFootprint(carried.fromX, carried.fromY, Walkable.Walkable);
        if (this.game.worldMap.towerConstruction.isBuildable(carried.x, carried.y) && carried.tower.Relocate(carried.x, carried.y)) {
            mazes[lane].setFootprint(carried.x, carried.y, Walkable.Blocked);
            Log.Info(`Moved ${carried.name} ${carried.fromX},${carried.fromY} -> ${carried.x},${carried.y}`);
            return true;
        }
        Log.Info(`${carried.name} cannot stand at ${carried.x},${carried.y} (unit at ${carried.tower.unit.x},${carried.tower.unit.y}); rebuilding`);
        this.rebuildTower(player, carried, lane);
        return false;
    }

    /** Replaces the tower's unit with a fresh one at the target, or refunds it; returns whether it stands. */
    private rebuildTower(player: Defender, carried: CarriedTower, lane: number): boolean {
        carried.tower.Sell();
        carried.tower.unit.destroy();
        if (this.game.worldMap.towerConstruction.placeTower(player, carried.typeId, carried.x, carried.y)) {
            return true;
        }
        this.game.worldMap.playerMazes[lane].setFootprint(carried.x, carried.y, Walkable.Walkable);
        Log.Info(`${carried.name} has no room at ${carried.x},${carried.y}, refunded`);
        player.giveGold(carried.value);
        return false;
    }

    /**
     * Whether a building's 2x2 footprint centred on (x, y) blocks walking, i.e. its pathing
     * is in place. IsTerrainPathable only reads the static map and never sees buildings, so
     * this drops an item on each cell instead: the game pushes an item off any cell that is
     * not walkable, buildings included, so an item that stays put means the cell is open.
     */
    private footprintBlocked(x: number, y: number): boolean {
        for (const dx of [-GRID / 2, GRID / 2]) {
            for (const dy of [-GRID / 2, GRID / 2]) {
                const probe = CreateItem(PROBE_ITEM, x + dx, y + dy)!;
                const stayed = Math.abs(GetItemX(probe) - (x + dx)) < 1 && Math.abs(GetItemY(probe) - (y + dy)) < 1;
                RemoveItem(probe);
                if (stayed) {
                    return false;
                }
            }
        }
        return true;
    }

    private moveUnits(player: Defender, area: Rectangle, from: LaneFrame, to: LaneFrame): void {
        const rectangle: rect = area.toRect();
        const group = GetUnitsInRectAll(rectangle)!;
        ForGroupBJ(group, () => {
            const unit = Unit.fromEnum();
            if (!unit || unit.owner.id !== player.id || unit.isUnitType(UNIT_TYPE_STRUCTURE) || !unit.isAlive()) {
                return;
            }
            const local = from.toLocal(unit.x, unit.y);
            const position = to.fromLocal(local.along, local.across);
            unit.setPosition(position.x, position.y);
        });
        DestroyGroup(group);
        RemoveRect(rectangle);
    }
}
