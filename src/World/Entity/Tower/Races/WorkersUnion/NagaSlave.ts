import {Tower} from '../../Specs/Tower';
import {WarcraftMaul} from '../../../../WarcraftMaul';
import {EndOfRoundTower} from '../../Specs/EndOfRoundTower';
import {AttackActionTower} from '../../Specs/AttackActionTower';
import {Util} from "../../../../../lib/translators";
import {Unit} from "w3ts";

export class NagaSlave extends Tower implements EndOfRoundTower, AttackActionTower {


    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        if (u === this.unit.handle) {
            if (!(this.unit.getAbilityLevel(FourCC('A09U')) > 0)) {
                return;
            }

            this.unit.setBaseDamage(this.unit.getBaseDamage(0) + 20, 0);

            this.DoSpell(this.game);
        }

    }

    public DoSpell(game: WarcraftMaul): void {
        const randomInt: number = Util.RandomInt(1, 4);
        const target: Unit | undefined = Unit.fromHandle(game.gameDamageEngineGlobals.udg_DamageEventTarget);
        if (!target) {
            return;
        }
        if (randomInt === 1 || randomInt === 2) {
            // const spellPoint: location = GetUnitLoc(this.tower);
            const tempUnit = Unit.create(this.owner, FourCC('u008'), this.unit.x, this.unit.y, bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            if (randomInt === 1) {
                tempUnit?.addAbility(FourCC('A09W'))
                tempUnit?.issueTargetOrder('thunderbolt', target);
            } else {
                tempUnit?.addAbility(FourCC('A09X'))
                tempUnit?.issueTargetOrder('forkedlightning', target);
            }
        }
    }

    public EndOfRoundAction(): void {
        this.unit.setBaseDamage(19, 0);
    }

}
