import {Tower} from '../../Specs/Tower';
import {AttackActionTower} from '../../Specs/AttackActionTower';
import {Unit, Group, Effect} from "w3ts";
import {COLOUR} from "../../../../../lib/translators";

export class Wyvern extends Tower implements AttackActionTower {
    public AttackAction(): void {
        if (this.game.worldMap.gameRoundHandler) {
            const nextWave = this.game.worldMap.gameRoundHandler.currentWave + 1;
            if (nextWave === 35 || nextWave === 36) {
                return;
            }
        }
        const sourceUnit = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventSource);
        if (sourceUnit === this.unit) {
            // Lightning arcs to creeps right next to the tower (the original 128, not the wider
            // radius the port briefly used)
            const grp = Group.create();
            grp?.enumUnitsInRange(this.unit.x, this.unit.y, 128.00, () => true)

            grp?.for(() => {
                const u = Unit.fromEnum();
                if (u) {
                    this.AttackGroup(u)
                }
            });

            grp?.destroy();
        }


    }

    private AttackGroup(unit: Unit): void {
        if (unit.owner.id > COLOUR.NAVY) {
            unit.life = Math.max(1.00, unit.life * 0.85);
            Effect.createAttachment('Abilities\\Spells\\Orc\\LightningShield\\LightningShieldTarget.mdl', unit, 'origin')?.destroy();
        }
    }
}
