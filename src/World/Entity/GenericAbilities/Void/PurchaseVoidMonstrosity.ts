/**
 *  [Void] Purchase void Monstrosity
 *  Buy the void Monstrosity with void fragments
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import {Unit} from "w3ts";


export class PurchaseVoidMonstrosity extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A0BK', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);

        if (owner && owner.GetVoidFragments() >= 800) {
            owner.SetVoidFragments(owner.GetVoidFragments() - 800);
        }
    }


}
