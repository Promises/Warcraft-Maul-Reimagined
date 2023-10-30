/**
 *  [Void] Purchase Void Minion
 *  Buy the void minion with void fragments
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";
import {Util} from "../../../../lib/translators";


export class PurchaseVoidMinion extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A0EZ', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);

        const targetUnit = Unit.fromHandle(GetSpellTargetUnit())!;

        if (owner) {
            const target: Tower | undefined = owner.GetTower(targetUnit.id);
            if (target) {
                if (target.GetTypeID() === FourCC('h02G')) {
                    if (owner.GetVoidFragments() >= 50) {
                        owner.SetVoidFragments(owner.GetVoidFragments() - 50);
                    }

                    const voidMinions: string[] = ['hC12', 'hC13', 'hC14'];
                    const index: number = Util.RandomInt(0, 2);

                    target.Upgrade(FourCC(voidMinions[index]));
                } else {
                    const voidBuilder = owner.getVoidBuilder();
                    if (voidBuilder) {
                        voidBuilder.mana += 50;
                    }
                }
            }
        }
    }

}
