import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';
import { AttackActionTower } from '../../Specs/AttackActionTower';

export class UndeadAcolyte extends Tower implements EndOfRoundTower, AttackActionTower {

    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        if (this.game.gameDamageEngineGlobals.udg_DamageEventAOE !== 1) {
            return;
        }
        if (u === this.unit.handle) {
            if (!(this.unit.getAbilityLevel(FourCC('A09S')) > 0)) {
                return;
            }
            this.unit.setBaseDamage(this.unit.getBaseDamage(0) + 5,0)
        }

    }


    public EndOfRoundAction(): void {
        this.unit.setBaseDamage(4,0)
    }

}
