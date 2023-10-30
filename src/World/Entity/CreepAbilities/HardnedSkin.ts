import { CreepAbility } from './specs/CreepAbility';
import {Unit} from "w3ts";

export class HardnedSkin extends CreepAbility {
    constructor(abilityUnit: Unit) {
        super('A069', abilityUnit);
    }
}
