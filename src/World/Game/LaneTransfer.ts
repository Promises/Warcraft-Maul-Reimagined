import {Unit} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {Tower} from '../Entity/Tower/Specs/Tower';
import {Walkable} from '../Antiblock/Maze';
import {COLOUR, DecodeFourCC, SendMessage} from '../../lib/translators';
import {Log} from '../../lib/Serilog/Serilog';

const GRID = 64;

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
 * Lets a player take over the gray lane when nobody holds it: gray is the last stretch before
 * the ship, so an empty gray lane leaks every creep. The player keeps their colour; their
 * area, spawn and last-defender bonus follow `Defender.lane`. Their towers in their own lane
 * are rebuilt at the same place in the gray lane (through the lane frames above), their
 * builders walk over, and anything still standing in the gray lane is sold to its owner first.
 *
 * Runs from a chat command, which fires on every client, so everything here is synchronous
 * game state.
 */
export class LaneTransfer {
    constructor(private readonly game: WarcraftMaul) {
    }

    public moveToGray(player: Defender): void {
        const target = COLOUR.GRAY;
        if (player.lane === target) {
            player.sendMessage('You already hold the gray lane');
            return;
        }
        for (const other of this.game.players.values()) {
            if (other.lane === target && other.slotState === PLAYER_SLOT_STATE_PLAYING) {
                player.sendMessage(`${other.getNameWithColour()} holds the gray lane`);
                return;
            }
        }
        if (this.game.worldMap.gameRoundHandler?.isWaveInProgress) {
            player.sendMessage('Wait until the wave is over before moving to the gray lane');
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
                x: this.snap(position.x),
                y: this.snap(position.y),
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
        SendMessage(`${player.getNameWithColour()} moved into the gray lane and is now the last defender`);
        if (rebuilt < carried.length) {
            player.sendMessage(`${carried.length - rebuilt} of ${carried.length} towers had no room in the gray lane and were refunded`);
        }
        Log.Info(`${player.getPlayerName()} moved ${rebuilt}/${carried.length} towers from lane ${oldLane} to gray`);
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
     * Rebuilds a tower at its target cell, or refunds it when the cell is not buildable there.
     * The lanes match in shape but not entirely in terrain (the last row of the gray lane,
     * by the ship, is not buildable), and CreateUnit would silently shift a building whose
     * footprint is not free - which could block or open the maze - so a tower that cannot
     * stand exactly where it belongs is refunded in full instead.
     */
    private rebuildTower(player: Defender, tower: CarriedTower, lane: number): boolean {
        if (!this.isBuildable(tower.x, tower.y)) {
            Log.Info(`${tower.name} (${DecodeFourCC(tower.typeId)}) ${tower.fromX},${tower.fromY} -> ${tower.x},${tower.y} not buildable, refunded`);
            player.giveGold(tower.value);
            return false;
        }
        const unit = Unit.create(player, tower.typeId, tower.x, tower.y, 270.00);
        if (!unit) {
            Log.Error(`Could not rebuild ${tower.name} at ${tower.x}, ${tower.y}, refunded`);
            player.giveGold(tower.value);
            return false;
        }
        const x = this.snap(unit.x);
        const y = this.snap(unit.y);
        if (x !== tower.x || y !== tower.y) {
            Log.Error(`${tower.name} was shifted from ${tower.x},${tower.y} to ${x},${y}, refunded`);
            unit.destroy();
            player.giveGold(tower.value);
            return false;
        }
        // Same as a finished construction: no rally point, then the tower logic is attached
        unit.removeAbility(FourCC('ARal'));
        this.game.worldMap.towerConstruction.SetupTower(unit, player);
        this.game.worldMap.playerMazes[lane].setFootprint(x, y, Walkable.Blocked);
        return true;
    }

    /** Whether all four cells of a tower footprint centred on (x, y) are buildable terrain. */
    private isBuildable(x: number, y: number): boolean {
        for (const dx of [-GRID / 2, GRID / 2]) {
            for (const dy of [-GRID / 2, GRID / 2]) {
                // The native answers whether the point is NOT pathable for the given type
                if (IsTerrainPathable(x + dx, y + dy, PATHING_TYPE_BUILDABILITY)) {
                    return false;
                }
            }
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

    /** Tower centres sit on grid corners; snapping removes float error from the frame maths. */
    private snap(value: number): number {
        return Math.floor(value / GRID + 0.5) * GRID;
    }
}
