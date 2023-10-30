import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { Unit } from "w3ts";

export class SummoningShrine extends Tower implements AttackActionTower {

    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: Unit | undefined = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (u === this.unit.handle && target) {
            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                target.x,
                target.y,
                bj_UNIT_FACING
            );

            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            tempUnit?.addAbility(FourCC('A06P'));
            tempUnit?.issueOrderAt('dreadlordinferno', target.x, target.y);
        }
    }

}
