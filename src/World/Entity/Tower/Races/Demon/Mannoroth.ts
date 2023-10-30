import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { Unit } from "w3ts";
import {Util} from "../../../../../lib/translators";

export class Mannoroth extends Tower implements AttackActionTower {

    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: Unit | undefined = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (Util.RandomInt(1, 3) !== 1) {
            return;
        }

        if (u === this.unit.handle && target) {
            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                this.unit.x,
                this.unit.y,
                bj_UNIT_FACING
            );

            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            tempUnit?.addAbility(FourCC('A06V'));
            tempUnit?.issueImmediateOrder('howlofterror');
        }
    }

}
