import {Tower} from '../../Specs/Tower';
import {PassiveCreepDiesInAreaEffectTower} from '../../Specs/PassiveCreepDiesInAreaEffectTower';
import {Creep} from '../../../Creep';
import {Unit} from "w3ts";

export class Plague extends Tower implements PassiveCreepDiesInAreaEffectTower {
    public PassiveCreepDiesInAreaEffect(dyingCreep: Creep): void {
        const dummy = Unit.create(this.owner, FourCC('u008'), dyingCreep.unit.x, dyingCreep.unit.y, bj_UNIT_FACING);
        dummy?.addAbility(FourCC('A0DZ'));
        dummy?.applyTimedLife(FourCC('BTLF'), 5.00);
    }
}
