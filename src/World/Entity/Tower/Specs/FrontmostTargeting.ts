import { Unit } from 'w3ts';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Creep } from '../../Creep';
import { SyncTrace } from '../../../../lib/SyncTrace';

// One group for every tower's look around: filled and emptied within a call
let nearby: group | undefined;
// How many of the ranked a pick's trace note lists
const TRACED = 8;

/**
 * Makes a tower attack the creep in its range that is furthest along the path, the one closest to
 * leaking: the fewest checkpoints left, and of those the one that reached its last checkpoint
 * first (a maze winds, so distance would not tell). A unit that is not a wave creep comes last.
 *
 * Call attackStarted when the tower starts an attack (EVENT_PLAYER_UNIT_ATTACKED). As with
 * RandomTargeting, the order does not stop the swing already started: it picks the next one, so
 * the tower turns to a creep that has just come to the front one attack later.
 */
export class FrontmostTargeting {
    constructor(private readonly game: WarcraftMaul, private readonly tower: Unit) {
    }

    public attackStarted(attacked: unit): void {
        const ranked = this.creepsInRange().sort((a, b) => this.compare(a, b));
        for (const target of ranked) {
            if (target === attacked) {
                return;
            }
            // An order the tower cannot follow (a flyer for a ground-only attack, say) is refused
            // and changes nothing: the next in line
            if (IssueTargetOrder(this.tower.handle, 'attack', target)) {
                // The best ranked, with where they stood, so a test can hold the order up against the
                // path (a few: a trace line is cut at about 250 letters)
                SyncTrace.note('target', `${SyncTrace.unit(this.tower)} front ${SyncTrace.unit(Unit.fromHandle(target))} n=${ranked.length} of `
                    + ranked.slice(0, TRACED).map(u => `${SyncTrace.unit(Unit.fromHandle(u))}@${math.floor(GetUnitX(u))},${math.floor(GetUnitY(u))}`).join(' '));
                return;
            }
        }
    }

    /** Negative when a is further along the path than b. */
    private compare(a: unit, b: unit): number {
        const creepA = this.creep(a);
        const creepB = this.creep(b);
        if (creepA === undefined || creepB === undefined) {
            return (creepA === undefined ? 1 : 0) - (creepB === undefined ? 1 : 0);
        }
        // Not `||`: in Lua 0 is true, so a tie would never reach the second test
        const left = creepA.checkpointsLeft() - creepB.checkpointsLeft();
        return left !== 0 ? left : creepA.reachedAt - creepB.reachedAt;
    }

    private creep(u: unit): Creep | undefined {
        return this.game.worldMap.spawnedCreeps.unitMap.get(GetHandleId(u));
    }

    private creepsInRange(): unit[] {
        const handle = this.tower.handle;
        const range = BlzGetUnitWeaponRealField(handle, UNIT_WEAPON_RF_ATTACK_RANGE, 0);
        const owner = GetOwningPlayer(handle);
        const group: group = nearby = nearby ?? CreateGroup()!;
        // The engine's spatial lookup finds what stands near, by centre and a little wide;
        // IsUnitInRange then measures the way attacks do, to the target's edge
        GroupEnumUnitsInRange(group, GetUnitX(handle), GetUnitY(handle), range + 128, undefined);
        const found: unit[] = [];
        for (let i = 0; i < BlzGroupGetSize(group); i++) {
            const u = BlzGroupUnitAt(group, i)!;
            if (IsUnitEnemy(u, owner) && IsUnitAliveBJ(u) && IsUnitVisible(u, owner) && IsUnitInRange(u, handle, range)) {
                found.push(u);
            }
        }
        GroupClear(group);
        return found;
    }
}
