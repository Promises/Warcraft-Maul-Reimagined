import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import {Unit} from "w3ts";

export class OgreWarrior extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventTarget;


        if (u === this.unit.handle && target) {
            if (UnitHasBuffBJ(target, FourCC('B01J'))) {
                return;
            }

            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                GetUnitX(target),
                GetUnitY(target),
                bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 1.00)
            tempUnit?.addAbility(FourCC('A029'))
            tempUnit?.issueTargetOrder('slow', Unit.fromHandle(target)!)
        }
    }
}
