import {Tower} from '../../Specs/Tower';
import {AttackActionTower} from '../../Specs/AttackActionTower';
import {Unit, Effect} from "w3ts";
import {CREEP_TYPE, Util} from "../../../../../lib/translators";

// One group for every Wyvern's look around: filled and emptied within an attack
let nearby: group | undefined;

export class Wyvern extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const round = this.game.worldMap.gameRoundHandler;
        // Its lightning takes a share of the creeps' life, so bosses are spared it
        if (round && this.game.worldMap.waveCreeps[round.currentWave - 1]?.getCreepType() === CREEP_TYPE.BOSS) {
            return;
        }
        if (this.game.gameDamageEngineGlobals.udg_DamageEventSource !== this.unit.handle) {
            return;
        }
        // Lightning arcs to creeps right next to the tower (the original 128, not the wider
        // radius the port briefly used). No filter: a function filter makes a boolexpr each call
        const group: group = nearby = nearby ?? CreateGroup()!;
        GroupEnumUnitsInRange(group, this.unit.x, this.unit.y, 128.00, undefined);
        for (let i = 0; i < BlzGroupGetSize(group); i++) {
            const u = Unit.fromHandle(BlzGroupUnitAt(group, i));
            if (u) {
                this.AttackGroup(u);
            }
        }
        GroupClear(group);
    }

    private AttackGroup(unit: Unit): void {
        // Any of the four creep players (owner > NAVY left Navy's creeps out)
        if (Util.isUnitCreep(unit.handle)) {
            unit.life = Math.max(1.00, unit.life * 0.85);
            Effect.createAttachment('Abilities\\Spells\\Orc\\LightningShield\\LightningShieldTarget.mdl', unit, 'origin')?.destroy();
        }
    }
}
