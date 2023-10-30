/**
 *  [Void] PayTheToll
 *  Pay a sum to remove a husk
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Color, TextTag, Unit} from "w3ts";


export class PayTheToll extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A095', game);
    }


    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const spellTargetUnit = Unit.fromHandle(GetSpellTargetUnit())!;

        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);
        if (owner) {
            const tower: Tower | undefined = owner.GetTower(spellAbilityUnit.id);
            const target: Tower | undefined = owner.GetTower(spellTargetUnit.id);
            if (tower && target) {
                const tt = TextTag.create()!;
                tt.setPos(target.unit.x, target.unit.y, 10);
                tt.setText('TRIGSTR_7924', 0); // Assuming 0 as the size
                // Assuming you have imported the `Color` class from some library
                const color = new Color(100, 100, 100, 0);
                tt.setColor(color.red, color.green, color.blue, color.alpha);
                tt.setVelocity(40, 90);
                tt.setPermanent(false);
                tt.setLifespan(4.00);
                tt.setFadepoint(2.00);

                owner.SetVoidFragments(owner.GetVoidFragments() + 10);
                const voidBuilder = owner.getVoidBuilder();
                if (voidBuilder) {
                    voidBuilder.mana = owner.GetVoidFragments();
                }
            }
        }
    }


}
