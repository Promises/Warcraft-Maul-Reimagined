/**
 *  Trade (Alliance Of Blades)
 *  Exchange 2 items for 1 new
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { AOB_ITEM_LOOT_LEVEL_ONE, AOB_ITEM_LOOT_LEVEL_TWO } from '../../../GlobalSettings';
import {MapPlayer,Item, Unit} from "w3ts";
import {Util} from "../../../../lib/translators";


export class Trade extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A016', game);
    }



    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const ownerPlayer: MapPlayer = triggerUnit.getOwner()!;
        const owner: Defender | undefined = this.game.players.get(ownerPlayer.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            if (tower) {
                const item: Item | undefined = tower.unit.getItemInSlot(1);
                if (item && item.level === 1) {
                    const indx: number = AOB_ITEM_LOOT_LEVEL_ONE.indexOf(item.typeId);
                    const mana: number = tower.unit.mana + 1;
                    tower.unit.mana = mana;
                    item.destroy();
                    if (mana > 1) {
                        let random: number = Util.RandomInt(0, AOB_ITEM_LOOT_LEVEL_ONE.length - 1);
                        if (random === indx) {
                            random++;
                        }
                        if (random > AOB_ITEM_LOOT_LEVEL_ONE.length - 1) {
                            random = 0;
                        }
                        const newItemTypeId: number = AOB_ITEM_LOOT_LEVEL_ONE[random];
                        tower.unit.addItemById(newItemTypeId);
                        tower.unit.mana = 0;
                    }
                }
            }
        }
    }


}
