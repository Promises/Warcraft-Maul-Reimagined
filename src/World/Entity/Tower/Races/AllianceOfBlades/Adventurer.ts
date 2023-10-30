import { Tower } from '../../Specs/Tower';
import { KillingActionTower } from '../../Specs/KillingActionTower';
import { AOB_ITEM_LOOT_LEVEL_ONE } from '../../../../GlobalSettings';
import {Unit} from "w3ts";
import {Util} from "../../../../../lib/translators";

export class Adventurer extends Tower implements KillingActionTower { // n02T

    public KillingAction(): void {
        const killer = Unit.fromHandle(GetKillingUnit());
        const victim = Unit.fromHandle(GetDyingUnit());

        if (killer === this.unit && victim) {
            if (!killer.getItemInSlot(1)) {
                const lootIndex: number = Util.RandomInt(0, AOB_ITEM_LOOT_LEVEL_ONE.length);
                killer.addItemById(AOB_ITEM_LOOT_LEVEL_ONE[lootIndex]);
            }
        }
    }


}
