/**
 *  Transfuse (Alliance Of Blades)
 *  consume lvl 2 item
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { AOB_ITEM_LOOT_LEVEL_ONE, AOB_ITEM_LOOT_LEVEL_TWO } from '../../../GlobalSettings';
import {Item, Unit} from "w3ts";
import {MapPlayer} from "../../../../lib/player";


export class Transfuse extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A03A', game);
    }


    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const ownerPlayer: MapPlayer = triggerUnit.getOwner()!;
        const owner: Defender | undefined = this.game.players.get(ownerPlayer.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            if (tower) {
                const item: Item | undefined = tower.unit.getItemInSlot(1);
                if (item && item.level === 2) {
                    item.destroy();
                    tower.unit.mana += 1.00;
                }
            }
        }
    }


}
