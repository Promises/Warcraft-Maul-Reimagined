import {Timer} from 'w3ts';
import {WorldMap} from '../WorldMap';
import {Creep} from '../Entity/Creep';
import {SyncTrace} from '../../lib/SyncTrace';

// How often the lanes' blockers are looked at
const CHECK_SECONDS = 1;

/**
 * Lifts anti-juggle blockers as soon as they guard nothing, instead of only at the end of a round
 * (which in continuous spawning comes late, or never): every second during a wave, a lane's blocker
 * goes once opening it would change the way of no creep now walking there - towards whichever
 * checkpoint each is on its way to (Maze.liftIdleAntiJugglers). A blocker by checkpoint 2's maze goes while
 * every creep is still on its way to checkpoint 1; one in a lane with no creeps goes at once. A
 * creep that starts a leg later plans it round what stands then, which is no juggle.
 * Runs on every client from game state, so all of them lift the same blockers.
 */
export class AntiJuggleRelease {
    constructor(private readonly worldMap: WorldMap) {
        Timer.create().start(CHECK_SECONDS, true, () => this.check());
    }

    private check(): void {
        const round = this.worldMap.gameRoundHandler;
        if (!round || !round.isWaveInProgress) {
            return;
        }
        const areas = this.worldMap.game.mapSettings.PLAYER_AREAS;
        this.worldMap.playerMazes.forEach((maze, lane) => {
            if (maze.GetAntiJugglers().length === 0) {
                return;
            }
            // The lane's creeps: in its area, or still in its spawn (just outside it), on their way already
            const spawns = this.worldMap.playerSpawns[lane];
            const inSpawn = (x: number, y: number) => [spawns?.spawnOne, spawns?.spawnTwo].some(spawn => spawn !== undefined
                && x >= GetRectMinX(spawn.rectangle) && x <= GetRectMaxX(spawn.rectangle)
                && y >= GetRectMinY(spawn.rectangle) && y <= GetRectMaxY(spawn.rectangle));
            // The legs they are on: by the checkpoint each walks to, where they stand
            const legs: Map<unknown, {toX: number, toY: number, creeps: {x: number, y: number}[]}> = new Map();
            this.worldMap.spawnedCreeps.unitMap.forEach((creep: Creep) => {
                const target = creep.targetCheckpoint;
                if (!target || !creep.unit.isAlive() || !(areas[lane].ContainsCreep(creep) || inSpawn(creep.unit.x, creep.unit.y))) {
                    return;
                }
                let leg = legs.get(target);
                if (!leg) {
                    leg = {toX: GetRectCenterX(target.rectangle), toY: GetRectCenterY(target.rectangle), creeps: []};
                    legs.set(target, leg);
                }
                leg.creeps.push({x: creep.unit.x, y: creep.unit.y});
            });
            const walking = [...legs.values()];
            for (const juggler of maze.liftIdleAntiJugglers(walking)) {
                SyncTrace.note('antijuggle', `lane=${lane} lifted at=${math.floor(juggler.GetX())},${math.floor(juggler.GetY())}`
                    + ` legs=${walking.length}`);
            }
        });
    }
}
