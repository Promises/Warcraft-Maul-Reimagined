/**
 *  Sacrifice (Alliance Of Blades)
 *  Consume 2 lvl 3 items, upgrade 2nd
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { AOB_ITEM_LOOT_LEVEL_FOUR, AOB_ITEM_LOOT_LEVEL_ONE, AOB_ITEM_LOOT_LEVEL_THREE } from '../../../GlobalSettings';
import {Item, Unit} from "w3ts";


export class Sacrifice extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0AJ', game);
    }



    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const ownerPlayer = triggerUnit.getOwner()!;
        const owner: Defender | undefined = this.game.players.get(ownerPlayer.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            if (tower) {
                const itemInSlot: Item | undefined = tower.unit.getItemInSlot(1);
                if (itemInSlot && itemInSlot.level === 3) {
                    const indx: number = AOB_ITEM_LOOT_LEVEL_THREE.indexOf(itemInSlot.typeId);
                    const mana: number = tower.unit.mana + 1;
                    tower.unit.mana = mana;
                    itemInSlot.destroy();
                    if (mana > 1) {
                        tower.unit.mana = 0;
                        tower.unit.addItemById(AOB_ITEM_LOOT_LEVEL_FOUR[indx]);
                    }
                }
            }
        }
    }


}
