import { GenericAbility } from './GenericAbility';
import { WarcraftMaul } from '../../WarcraftMaul';
import { Creep } from '../Creep';
import {Unit} from "w3ts";


/**
 *  Move (Builders)
 *  Forces target unit to move
 */
export class Move extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0EB', game);
    }

    public TargetOnEffectAction(): void {
        const targetUnit = Unit.fromHandle(GetSpellTargetUnit());
        const creep: Creep | undefined = this.game.worldMap.spawnedCreeps.unitMap.get(targetUnit!.id);

        if (creep) {
            creep.ReapplyMovement();
        }
    }


}
