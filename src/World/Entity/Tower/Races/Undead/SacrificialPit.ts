import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { PassiveCreepDiesInAreaEffectTower } from '../../Specs/PassiveCreepDiesInAreaEffectTower';
import { Creep } from '../../../Creep';
import {Unit} from "w3ts";

export class SacrificialPit extends Tower implements PassiveCreepDiesInAreaEffectTower {
    public PassiveCreepDiesInAreaEffect(dyingCreep: Creep): void {
        const dummy = Unit.create(this.owner, FourCC('u008'), dyingCreep.unit.x, dyingCreep.unit.y, bj_UNIT_FACING);
        dummy?.addAbility(FourCC('A08P'));
        dummy?.issueOrderAt('rainoffire', dyingCreep.unit.x, dyingCreep.unit.y);
        dummy?.applyTimedLife(FourCC('BTLF'), 3.00);
    }
}
