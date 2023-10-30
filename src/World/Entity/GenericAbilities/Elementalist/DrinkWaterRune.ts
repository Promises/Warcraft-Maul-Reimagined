/**
 *  Moss consumes water rune
 */
import { GenericAbility } from '../GenericAbility';
import { Defender } from '../../Players/Defender';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";
import {Util} from "../../../../lib/translators";


export class DrinkWaterRune extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0E3', game);
    }


    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const owner: Defender | undefined = this.game.players.get(triggerUnit.getOwner()!.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            const spellTargetUnit: Unit = Unit.fromHandle(GetSpellTargetUnit())!;
            const target: Tower | undefined = owner.GetTower(spellTargetUnit.id);

            if (tower && target) {
                const mana: number = tower.unit.mana;

                if (target.GetTypeID() === FourCC('n01R')) {
                    target.Upgrade(FourCC('n027'));

                    if (mana > 8) {
                        let newId: number = FourCC('u037');
                        if (Util.RandomInt(1000, 2000) === 1337) {
                            newId = FourCC('h03G');
                        }
                        tower.Upgrade(newId);
                    } else {
                        tower.unit.mana += 1.00;
                    }
                }
            }
        }
    }



}
