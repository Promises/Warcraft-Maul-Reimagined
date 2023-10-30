/**
 *  [Void] PayTheToll
 *  Pay a sum to remove a husk
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { AntiJuggleTower } from '../../AntiJuggle/AntiJuggleTower';
import {Unit} from "w3ts";


export class PayTheToll extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A0BF', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);

        if (owner) {
            const tower = owner.GetTower(spellAbilityUnit.id);
            if (tower && owner.getGold() >= 50) {
                owner.giveGold(-50);

                if (tower.GetTypeID() === FourCC('h02S')) {
                    owner.SetVoidFragmentTick(owner.GetVoidFragmentTick() - 1);
                }

                if (this.game.worldMap.antiBlock) {
                    this.game.worldMap.antiBlock.CleanUpRemovedConstruction(tower.unit);
                }

                tower.Remove();
            }
        }
    }


}
