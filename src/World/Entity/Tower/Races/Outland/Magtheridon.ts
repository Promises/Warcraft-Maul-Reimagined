import {Tower} from '../../Specs/Tower';
import {AttackActionTower} from '../../Specs/AttackActionTower';
import {Util} from "../../../../../lib/translators";
import {Unit} from "w3ts";

export class Magtheridon extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventTarget;

        if (Util.RandomInt(1, 100) > 15) {
            return;
        }
        if (u === this.unit.handle && target) {

            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                this.unit.x,
                this.unit.y,
                bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            tempUnit?.addAbility(FourCC('A0DT'));
            tempUnit?.issueOrderAt('rainoffire', GetUnitX(target), GetUnitY(target))
        }
    }
}
