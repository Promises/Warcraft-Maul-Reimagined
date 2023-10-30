import {Tower} from '../../Specs/Tower';
import {EndOfRoundTower} from '../../Specs/EndOfRoundTower';
import {AttackActionTower} from '../../Specs/AttackActionTower';

export class HumanPeasant extends Tower implements EndOfRoundTower, AttackActionTower {


    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        if (u === this.unit.handle) {
            if (!(this.unit.getAbilityLevel(FourCC('A09T')) > 0)) {
                return;
            }

            this.unit.setBaseDamage(this.unit.getBaseDamage(0) + 2, 0)


        }

    }


    public EndOfRoundAction(): void {
        this.unit.setBaseDamage(9, 0)
    }

}
