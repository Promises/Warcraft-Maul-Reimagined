import { Util } from '../../../../lib/translators';
import { Unit } from 'w3ts';
import { SyncTrace } from '../../../../lib/SyncTrace';

// One group for every tower's look around: filled and emptied within a call
let nearby: group | undefined;

/**
 * Makes a tower attack a random enemy in its range instead of the one it picked itself.
 *
 * Call attackStarted when the tower starts an attack (EVENT_PLAYER_UNIT_ATTACKED). The order
 * does not stop the swing already started (seen with the Venom Tower): that one lands on its
 * target, and the order picks the next one. So every attack rolls the one after it, among the
 * creeps in range, the one attacked included; for another creep the tower is ordered onto it.
 * Each attack goes to a creep picked at random. (Letting the first swing on a rolled creep through
 * unrolled gave each rolled creep two attacks in a row.)
 *
 * A creep the tower is ordered onto that walks out of its range is dropped by the game, and the
 * tower takes another (test_venom_target_leaves_range): nothing to do here for that. The trace
 * notes each order, for that test.
 */
export class RandomTargeting {
    constructor(private readonly tower: Unit) {
    }

    public attackStarted(attacked: unit): void {
        const candidates = this.creepsInRange();
        while (candidates.length > 0) {
            const index = Util.RandomInt(0, candidates.length - 1);
            const target = candidates[index];
            if (target === attacked) {
                return;
            }
            // An order the tower cannot follow (a flyer for a ground-only attack, say) is refused
            // and changes nothing: roll again without that one
            if (IssueTargetOrder(this.tower.handle, 'attack', target)) {
                SyncTrace.note('target', `${SyncTrace.unit(this.tower)} ordered ${SyncTrace.unit(Unit.fromHandle(target))}`);
                return;
            }
            candidates.splice(index, 1);
        }
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
            const creep = BlzGroupUnitAt(group, i)!;
            if (Util.isUnitCreep(creep) && IsUnitAliveBJ(creep) && IsUnitVisible(creep, owner)
                && IsUnitInRange(creep, handle, range)) {
                found.push(creep);
            }
        }
        GroupClear(group);
        return found;
    }
}
