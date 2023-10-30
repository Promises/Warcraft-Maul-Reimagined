/**
 *  Siphon Energy (Elementalist)
 *  Combines two runes to one tower
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";
import {DecodeFourCC} from "../../../../lib/translators";


export class SiphonEnergy extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0CT', game);
    }

    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const spellTargetUnit: Unit = Unit.fromHandle(GetSpellTargetUnit())!;
        const owner: Defender | undefined = this.game.players.get(triggerUnit.getOwner()!.id);

        if (owner) {
            const source: Tower | undefined = owner.GetTower(triggerUnit.id);
            const target: Tower | undefined = owner.GetTower(spellTargetUnit.id);

            if (source && target) {
                const sourceTypeID = DecodeFourCC(source.GetTypeID());
                const targetTypeID = DecodeFourCC(target.GetTypeID());

                if (this.game.abilityHandler.elementalistSettings.HasCombination(sourceTypeID, targetTypeID)) {
                    const combination = this.game.abilityHandler.elementalistSettings.GetCombination(sourceTypeID, targetTypeID);
                    if (combination !== '') {
                        source.Upgrade(FourCC(combination));
                        target.Upgrade(FourCC('n027'));
                    }
                }
            }
        }
    }



}
