/**
 *  [Night Elf] Feline Swiftness
 *  Gives tower increased speed
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import {Unit} from "w3ts";


export class FelineSwiftness extends GenericAbility implements AbilityOnCastTargetsUnit {
    private givesAbility: number = FourCC('S007');
    private maxLevel: number = 10;

    constructor(game: WarcraftMaul) {
        super('A0B4', game);
    }

    public TargetOnCastAction(): void {
        const targetUnit = Unit.fromHandle(GetSpellTargetUnit());

        if (targetUnit) {
            if (targetUnit.getAbilityLevel(this.givesAbility) >= this.maxLevel) {
                return;
            }

            if (targetUnit.getAbilityLevel(this.givesAbility) >= 1) {
                targetUnit.incAbilityLevel(this.givesAbility);
            } else {
                targetUnit.addAbility(this.givesAbility);
            }
        }
    }



}
