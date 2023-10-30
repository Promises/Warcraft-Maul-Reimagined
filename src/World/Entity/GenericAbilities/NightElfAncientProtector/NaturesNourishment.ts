/**
 *  [Night Elf] Wolven Fury
 *  Gives tower increased damage
 */
import {GenericAbility} from '../GenericAbility';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Unit} from "w3ts";


export class NaturesNourishment extends GenericAbility implements AbilityOnCastTargetsUnit {
    private givesAbilityOne: number = FourCC('A0BX');
    private givesAbilityTwo: number = FourCC('S009');
    private maxLevel: number = 5;

    constructor(game: WarcraftMaul) {
        super('A0BI', game);
    }

    public TargetOnCastAction(): void {
        const targetUnit = Unit.fromHandle(GetSpellTargetUnit());

        if (targetUnit) {
            if (!(targetUnit.getAbilityLevel(this.givesAbilityOne) >= this.maxLevel)) {
                if (targetUnit.getAbilityLevel(this.givesAbilityOne) >= 1) {
                    targetUnit.incAbilityLevel(this.givesAbilityOne);
                } else {
                    targetUnit.addAbility(this.givesAbilityOne);
                }
            }

            if (!(targetUnit.getAbilityLevel(this.givesAbilityTwo) >= this.maxLevel)) {
                if (targetUnit.getAbilityLevel(this.givesAbilityTwo) >= 1) {
                    targetUnit.incAbilityLevel(this.givesAbilityTwo);
                } else {
                    targetUnit.addAbility(this.givesAbilityTwo);
                }
            }
        }
    }


}
