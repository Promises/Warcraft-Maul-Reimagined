import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import {Util} from "../../../../../lib/translators";
import {Unit} from "w3ts";

// One group for every Ice Troll Priest's look around: filled and emptied within a tick
let nearby: group | undefined;

export class IceTrollPriest extends Tower implements TickingTower {

    /** A dummy casts Frost Nova on a random live creep within 500 of the tower. */
    private FrostNova(): void {
        // The creeps of this tick only, and no filter: a Condition made each tick is never freed
        const group: group = nearby = nearby ?? CreateGroup()!;
        GroupEnumUnitsInRange(group, this.unit.x, this.unit.y, 500.00, undefined);
        const targets: unit[] = [];
        for (let i = 0; i < BlzGroupGetSize(group); i++) {
            const creep = BlzGroupUnitAt(group, i)!;
            if (Util.isUnitCreep(creep) && IsUnitAliveBJ(creep)) {
                targets.push(creep);
            }
        }
        GroupClear(group);
        if (targets.length === 0) {
            return;
        }
        const target = Unit.fromHandle(targets[Util.RandomInt(0, targets.length - 1)]);
        const dummy = Unit.create(this.owner, FourCC('u008'), this.unit.x, this.unit.y, 0);
        dummy?.applyTimedLife(FourCC('BTLF'), 1.00);
        dummy?.addAbility(FourCC('A08J'));
        if (target) {
            dummy?.issueTargetOrder('frostnova', target);
        }
    }

    public Action(): void {
        this.FrostNova();
    }

    public GetTickModulo(): number {
        return 49;
    }
}
