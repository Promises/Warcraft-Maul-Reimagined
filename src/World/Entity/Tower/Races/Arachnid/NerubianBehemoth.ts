import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { Unit } from "w3ts";
import {Util} from "../../../../../lib/translators";

export class NerubianBehemoth extends Tower implements AttackActionTower {
    public AttackAction(): void {
        if (Util.RandomInt(1, 4) !== 1) {
            return;
        }

        const sourceUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventSource);
        const targetUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (sourceUnit === this.unit && targetUnit) {
            const tempUnit = Unit.create(this.owner, FourCC('u008'), sourceUnit.x, sourceUnit.y, bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 1.00);
            tempUnit?.addAbility(FourCC('A0AH'));
            tempUnit?.issueTargetOrder('cripple', targetUnit);
        }
    }
}
