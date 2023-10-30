/**
 *  [Void] Purchase void Lord
 *  Buy the void Lord with void fragments
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import {Unit} from "w3ts";


export class PurchaseVoidLord extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A0BL', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);

        if (owner && owner.GetVoidFragments() >= 1200) {
            owner.SetVoidFragments(owner.GetVoidFragments() - 1200);
        }
    }



}
