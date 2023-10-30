import { Tower } from '../../Specs/Tower';
import { AOB_ITEM_LOOT_LEVEL_ONE } from '../../../../GlobalSettings';
import { TickingTower } from '../../Specs/TickingTower';
import { Log } from '../../../../../lib/Serilog/Serilog';
import {Util} from "../../../../../lib/translators";
import {Item} from "w3ts";

export class Scavenger extends Tower implements TickingTower {

    public Scavenge(): void {

        if (this.unit.getItemInSlot(0) === null) {
            // Log.Debug(`${this.UniqueID}`);
            const lootindx: number = Util.RandomInt(0, AOB_ITEM_LOOT_LEVEL_ONE.length - 1);
            const i = Item.create(AOB_ITEM_LOOT_LEVEL_ONE[lootindx], this.unit.x, this.unit.y);
            if (i && !this.unit.addItem(i)) {
                i?.destroy()
            }
        }


    }

    public Action(): void {
        this.Scavenge();
    }

    public GetTickModulo(): number {
        return 300;
    }


}
