import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';

export class Sammy extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        if (u === this.unit.handle) {
            this.unit.mana = this.unit.mana + 1;
            if (this.unit.mana >= 1000) {
                this.Upgrade(FourCC('u040'));
            }

        }
    }
}
