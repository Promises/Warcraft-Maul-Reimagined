import {Unit} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {Tower} from '../Entity/Tower/Specs/Tower';
import {Walkable} from '../Antiblock/Maze';
import {COLOUR, SendMessage} from '../../lib/translators';
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
            carried.push({typeId: tower.unit.typeId, x: this.snap(position.x), y: this.snap(position.y)});
            this.removeTower(tower, oldLane);
        }

        for (const builder of this.builders(player)) {
            if (oldArea.ContainsUnit(builder)) {
                const local = from.toLocal(builder.x, builder.y);
                const position = to.fromLocal(local.along, local.across);
                builder.setPosition(position.x, position.y);
            }
        }

        const spawns = this.game.worldMap.playerSpawns;
        spawns[target].isOpen = spawns[oldLane].isOpen;
        spawns[oldLane].isOpen = false;
        player.moveToLane(target);

        for (const tower of carried) {
            this.rebuildTower(player, tower, target);
        }

        PanCameraToTimedForPlayer(player.handle, player.getCenterX(), player.getCenterY(), 0.00);
        SendMessage(`${player.getNameWithColour()} moved into the gray lane and is now the last defender`);
        Log.Info(`${player.getPlayerName()} moved ${carried.length} towers from lane ${oldLane} to gray`);
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

    private rebuildTower(player: Defender, tower: CarriedTower, lane: number): void {
        const unit = Unit.create(player, tower.typeId, tower.x, tower.y, 270.00);
        if (!unit) {
            Log.Error(`Could not rebuild tower ${tower.typeId} at ${tower.x}, ${tower.y}`);
            return;
        }
        // Same as a finished construction: no rally point, then the tower logic is attached
        unit.removeAbility(FourCC('ARal'));
        this.game.worldMap.towerConstruction.SetupTower(unit, player);
        this.game.worldMap.playerMazes[lane].setFootprint(tower.x, tower.y, Walkable.Blocked);
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
