/**
 *  [Night Elf] Wolven Fury
 *  Gives tower increased damage
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import {Unit} from "w3ts";


export class WolvenFury extends GenericAbility implements AbilityOnCastTargetsUnit {
    private givesAbility: number = FourCC('A0C4');
    private maxLevel: number = 10;

    constructor(game: WarcraftMaul) {
        super('A0BG', game);
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
