import { Tower } from '../../Specs/Tower';
import { WarcraftMaul } from '../../../../WarcraftMaul';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import {Unit} from "w3ts";

export class MoonDancer extends Tower implements AttackActionTower {

    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        if (u === this.unit.handle) {
            const mana: number = this.unit.mana + 1.00;
            this.unit.mana = mana;

            if (mana > 4) {
                this.unit.mana = 0.00;
                this.DoSpell(this.game);
            }
        }
    }

    public DoSpell(game: WarcraftMaul): void {
        const target: Unit | undefined = Unit.fromHandle(game.gameDamageEngineGlobals.udg_DamageEventTarget);
        if (!target) {
            return;
        }

        const tempUnit = Unit.create(this.owner, FourCC('u008'), target.x, target.y, bj_UNIT_FACING);

        tempUnit?.applyTimedLife(FourCC('BTLF'), 1.00);
        tempUnit?.addAbility(FourCC('A022'));
        tempUnit?.issueOrderAt('blizzard', target.x, target.y);
    }
}
