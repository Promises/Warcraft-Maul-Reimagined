import { CreepAbility } from './specs/CreepAbility';
import {Unit} from "w3ts";

export class TornadoAura extends CreepAbility {
    constructor(abilityUnit: Unit) {
        super('A01S', abilityUnit);
    }
}
