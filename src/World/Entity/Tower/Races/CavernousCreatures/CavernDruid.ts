import { Tower } from '../../Specs/Tower';
import { InitialDamageModificationTower } from '../../Specs/InitialDamageModificationTower';
import { Unit } from "w3ts";

export class CavernDruid extends Tower implements InitialDamageModificationTower {
    public InitialDamageModification(): void {
        const sourceUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventSource);
        if (sourceUnit === this.unit) {
            this.game.gameDamageEngineGlobals.udg_DamageEventAmount += this.unit.mana * 25.00;
            this.unit.mana = 0.00;
        }
    }
}
