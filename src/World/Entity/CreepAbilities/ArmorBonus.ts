import { CreepAbility } from './specs/CreepAbility';
import {Unit} from "w3ts";

export class ArmorBonus extends CreepAbility {
    constructor(abilityUnit: Unit) {
        super('A06C', abilityUnit);
    }
}
