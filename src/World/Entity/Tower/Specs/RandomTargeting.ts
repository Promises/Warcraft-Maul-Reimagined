import { Util } from '../../../../lib/translators';
import { Unit } from 'w3ts';

// One group for every tower's look around: filled and emptied within a call
let nearby: group | undefined;

/**
 * Makes a tower attack a random enemy in its range instead of the one it picked itself.
 *
 * Call attackStarted when the tower starts an attack (EVENT_PLAYER_UNIT_ATTACKED). It rolls among
 * the creeps in range, the one attacked included; for another creep the tower is ordered onto it.
 * The swing already started still lands on the old target (seen with the Venom Tower), then the
 * tower attacks the rolled creep. That first swing on it is let through, and the next one is
 * rolled again, so each rolled creep takes two attacks.
 */
export class RandomTargeting {
    private ordered: unit | undefined;

    constructor(private readonly tower: Unit) {
    }

    public attackStarted(attacked: unit): void {
        if (attacked === this.ordered) {
            this.ordered = undefined;
            return;
        }
        const candidates = this.creepsInRange();
        while (candidates.length > 0) {
            const index = Util.RandomInt(0, candidates.length - 1);
            const target = candidates[index];
            if (target === attacked) {
                return;
            }
            // An order the tower cannot follow (a flyer for a ground-only attack, say) is refused
            // and changes nothing: roll again without that one
            this.ordered = target;
            if (IssueTargetOrder(this.tower.handle, 'attack', target)) {
                return;
            }
            this.ordered = undefined;
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
