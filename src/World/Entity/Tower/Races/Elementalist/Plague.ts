import {Tower} from '../../Specs/Tower';
import {PassiveCreepDiesInAreaEffectTower} from '../../Specs/PassiveCreepDiesInAreaEffectTower';
import {Creep} from '../../../Creep';
import {SyncTrace} from '../../../../../lib/SyncTrace';

const SPREAD = 300;
const DAMAGE_PER_SECOND = 50;
const SECONDS = 5;
// One group for every spread: filled, copied and cleared within a single call
const nearby: group = CreateGroup()!;

/**
 * Death + Air: when a creep dies in its lane, the creeps within 300 of it catch the plague, 50
 * damage a second for 5 seconds. In code (its dummy-cast disease cloud did 30 a second, where it
 * happened to be cast).
 */
export class Plague extends Tower implements PassiveCreepDiesInAreaEffectTower {
    public PassiveCreepDiesInAreaEffect(dyingCreep: Creep): void {
        const dying = dyingCreep.unit.handle;
        GroupEnumUnitsInRange(nearby, dyingCreep.unit.x, dyingCreep.unit.y, SPREAD, undefined);
        const infected: unit[] = [];
        ForGroup(nearby, () => {
            const u = GetEnumUnit()!;
            if (u !== dying && UnitAlive(u) && IsUnitEnemy(u, this.owner.handle) && !IsUnitType(u, UNIT_TYPE_STRUCTURE)) {
                infected.push(u);
            }
        });
        GroupClear(nearby);
        if (infected.length === 0) {
            return;
        }
        SyncTrace.note('plague', `p${this.owner.id} infected ${infected.length}`);
        let seconds = 0;
        const timer = CreateTimer()!;
        TimerStart(timer, 1, true, () => {
            seconds++;
            for (const u of infected) {
                if (UnitAlive(u)) {
                    UnitDamageTarget(this.unit.handle, u, DAMAGE_PER_SECOND, false, false, ATTACK_TYPE_MAGIC,
                        DAMAGE_TYPE_DISEASE, WEAPON_TYPE_WHOKNOWS);
                }
            }
            if (seconds >= SECONDS) {
                DestroyTimer(timer);
            }
        });
    }
}
