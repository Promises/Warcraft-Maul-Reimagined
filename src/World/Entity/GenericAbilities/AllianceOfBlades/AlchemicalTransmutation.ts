/**
 *  AlchemicalTransmutation (Alliance Of Blades)
 *  Pay 75g to upgrade lvl 1 to 3
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {  AOB_ITEM_LOOT_LEVEL_ONE, AOB_ITEM_LOOT_LEVEL_THREE } from '../../../GlobalSettings';
import {Unit} from "w3ts";


export class AlchemicalTransmutation extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0B0', game);
    }


    public TargetOnEffectAction(): void {
        const unit = Unit.fromEvent();
        const owner: Defender | undefined = this.game.players.get(unit?.getOwner()?.id!)
        if (owner) {
            const tower: Tower | undefined = owner.GetTower(unit?.id!);
            if (tower) {
                const item = tower.unit.getItemInSlot(1)
                if (item && item.level === 1) {
                    const indx: number = AOB_ITEM_LOOT_LEVEL_ONE.indexOf(item.typeId);
                    item.destroy();
                    tower.unit.addItemById(AOB_ITEM_LOOT_LEVEL_THREE[indx])
                } else {
                    owner.giveGold(75);
                }
            }
        }

    }


}
