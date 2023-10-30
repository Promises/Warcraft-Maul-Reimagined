/**
 *  Upgrade undead to lvl 2
 */
import { GenericAbility } from '../GenericAbility';
import { Defender } from '../../Players/Defender';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";


export class UndeadUpgrade extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0E6', game);
    }


    public TargetOnEffectAction(): void {
        const triggerUnit = Unit.fromEvent()!;
        const owner: Defender | undefined = this.game.players.get(triggerUnit.getOwner()!.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            if (tower) {
                tower.Upgrade(FourCC('u038'));
            }
        }
    }



}
