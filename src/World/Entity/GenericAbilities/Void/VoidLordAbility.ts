/**
 *  [Void] VoidLordAbility
 *  Consume void worshipper for 250 extra dmg
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";


export class VoidLordAbility extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A09E', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const spellTargetUnit = Unit.fromHandle(GetSpellTargetUnit())!;

        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit?.getOwner()!.id);
        if (owner) {
            const tower: Tower | undefined = owner.GetTower(spellAbilityUnit.id);
            const target: Tower | undefined = owner.GetTower(spellTargetUnit.id);
            if (tower && target) {
                if (tower.GetTypeID() === FourCC('h01O') && target.GetTypeID() === FourCC('h02G')) {
                    tower.unit.setBaseDamage(tower.unit.getBaseDamage(0) + 250, 0) // Assuming this property exists for tower's damage
                    target.Upgrade(FourCC('h02S')); // Assuming this method exists for upgrading tower type
                }
            }
        }
    }



}
