import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class Sapphiron extends Tower implements AttackActionTower, EndOfRoundTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;

        if (u === this.unit.handle) {
            if (this.unit.mana >= 100) {
                this.unit.mana = this.unit.mana - 100;
                if (this.unit.getAbilityLevel(FourCC('A0F9')) <= 6) {
                    this.unit.incAbilityLevel(FourCC('A0F9'))
                }
            }
            this.unit.mana = this.unit.mana + 1;
        }
    }

    public EndOfRoundAction(): void {
        this.unit.setAbilityLevel(FourCC('A0F9'), 1);
    }
}
