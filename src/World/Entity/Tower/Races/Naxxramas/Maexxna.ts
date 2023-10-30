import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import {Unit} from "w3ts";

export class Maexxna extends Tower implements AttackActionTower {


    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventTarget;

        if (u === this.unit.handle && target) {
            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                this.unit.x,
                this.unit.y,
                bj_UNIT_FACING);

            tempUnit?.applyTimedLife(FourCC('BTLF'), 20.00);
            tempUnit?.addAbility(FourCC('A0FA'));
            tempUnit?.issueTargetOrder('acidbomb', Unit.fromHandle(target)!);

        }
    }
}
