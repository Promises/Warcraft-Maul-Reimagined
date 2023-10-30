/**
 *  [Void] Purchase void Being
 *  Buy the void being with void fragments
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import {Unit} from "w3ts";


export class PurchaseVoidBeing extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A0BB', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);

        if (owner && owner.GetVoidFragments() >= 100) {
            owner.SetVoidFragments(owner.GetVoidFragments() - 100);
        }
    }


}
