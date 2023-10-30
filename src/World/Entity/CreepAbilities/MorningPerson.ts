import { CreepAbility } from './specs/CreepAbility';
import { WarcraftMaul } from '../../WarcraftMaul';
import { AttackActionCreepAbility } from './specs/AttackActionCreepAbility';
import {Unit} from "w3ts";

export class MorningPerson extends CreepAbility {
    constructor(abilityUnit: Unit) {
        super('A06D', abilityUnit);
    }



}
