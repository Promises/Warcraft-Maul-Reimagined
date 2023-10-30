import { CreepAbility } from './specs/CreepAbility';
import {Unit} from "w3ts";

export class Evasion extends CreepAbility {
    constructor(abilityUnit: Unit) {
        super('A06A', abilityUnit);
    }
}
