/**
 *  Enchanment (Alliance Of Blades)
 *  Upgrade an item to lvl two
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { AOB_ITEM_LOOT_LEVEL_ONE, AOB_ITEM_LOOT_LEVEL_TWO } from '../../../GlobalSettings';
import {Item, MapPlayer, Unit} from "w3ts";


export class Enchantment extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A03F', game);
    }



    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const ownerPlayer: MapPlayer = triggerUnit.getOwner()!;
        const owner: Defender | undefined = this.game.players.get(ownerPlayer.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            if (tower) {
                const itemInSlot: Item | undefined = tower.unit.getItemInSlot(1);
                if (itemInSlot && itemInSlot.level === 1) {
                    const indx: number = AOB_ITEM_LOOT_LEVEL_ONE.indexOf(itemInSlot.typeId);
                    const lvlTwoItem: number = AOB_ITEM_LOOT_LEVEL_TWO[indx];
                    itemInSlot.destroy();
                    tower.unit.addItemById(lvlTwoItem);
                }
            }
        }
    }


}
