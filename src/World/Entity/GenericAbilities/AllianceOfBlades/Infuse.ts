/**
 *  Infuse (Alliance Of Blades)
 *  gamble upgrade lvl 2 to 3
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { AOB_ITEM_LOOT_LEVEL_THREE, AOB_ITEM_LOOT_LEVEL_TWO } from '../../../GlobalSettings';
import {MapPlayer,Item, Unit} from "w3ts";


export class Infuse extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0A7', game);
    }



    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const ownerPlayer: MapPlayer = triggerUnit.getOwner()!;
        const owner: Defender | undefined = this.game.players.get(ownerPlayer.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            if (tower) {
                const itemInSlot: Item | undefined = tower.unit.getItemInSlot(1);
                if (itemInSlot && itemInSlot.level === 2) {
                    const indx: number = AOB_ITEM_LOOT_LEVEL_TWO.indexOf(itemInSlot.typeId);
                    itemInSlot.destroy();
                    const mana: number = tower.unit.mana;
                    tower.unit.mana = 0;
                    if (10 * mana > Math.floor(Math.random() * 100)) {
                        tower.unit.addItemById(AOB_ITEM_LOOT_LEVEL_THREE[indx]);
                    }
                }
            }
        }
    }


}
