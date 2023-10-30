import { GenericAbility } from './GenericAbility';
import { WarcraftMaul } from '../../WarcraftMaul';
import {Unit} from "w3ts";


/**
 *  Frost Attack (A08X)
 *  Slows enemies with splash
 */
export class FrostAttack extends GenericAbility implements AttackActionAbility {
    constructor(game: WarcraftMaul) {
        super('A08X', game);
    }

    public AttackAction(): void {
        const targetUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);
        const sourceUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventSource);

        if (targetUnit && sourceUnit) {
            if (GetUnitAbilityLevel(sourceUnit.handle, FourCC('A08X')) <= 0) {
                return;
            }
            if (UnitHasBuffBJ(targetUnit.handle, FourCC('B017'))) {
                return;
            }

            const dummy = Unit.create(sourceUnit.owner, FourCC('u008'), targetUnit.x, targetUnit.y, bj_UNIT_FACING);
            dummy?.addAbility(FourCC('A02U')); // Slow
            dummy?.issueTargetOrder('slow', targetUnit);
            dummy?.applyTimedLife(FourCC('BTLF'), 1.00);
        }
    }



}
