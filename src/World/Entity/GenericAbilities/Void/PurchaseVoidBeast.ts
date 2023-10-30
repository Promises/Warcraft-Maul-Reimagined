/**
 *  [Void] Purchase void Beast
 *  Buy the void bEast with void fragments
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import {Unit} from "w3ts";


export class PurchaseVoidBeast extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A0BJ', game);
    }


    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);

        if (owner && owner.GetVoidFragments() >= 400) {
            owner.SetVoidFragments(owner.GetVoidFragments() - 400);
        }
    }

}
