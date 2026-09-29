import {AscendedTower} from '../../Specs/AttunedTower';
import {AttackActionTower} from '../../Specs/AttackActionTower';
import {SyncTrace} from '../../../../../lib/SyncTrace';
import {Unit} from 'w3ts';
import {isBossWave} from './BossWave';

const ROOT_EVERY = 5;
const ROOT_SECONDS = 1;
const ROOTS = 'Abilities\\Spells\\NightElf\\EntanglingRoots\\EntanglingRootsTarget.mdl';

/**
 * The World Tree, ascended: every fifth attack roots its target for a second, except in boss
 * waves. An attack is counted once: its splash hits come as further damage events, which the
 * damage engine counts up in udg_DamageEventAOE. The root is the engine's stun counter
 * (BlzPauseUnitEx), which stacks with other stuns and keeps the creep's orders.
 */
export class Nordrassil extends AscendedTower implements AttackActionTower {
    private attacks: number = 0;

    public AttackAction(): void {
        const globals = this.game.gameDamageEngineGlobals;
        if (globals.udg_DamageEventSource !== this.unit.handle || globals.udg_IsDamageSpell || globals.udg_DamageEventAOE > 1) {
            return;
        }
        this.attacks++;
        const target = globals.udg_DamageEventTarget;
        if (this.attacks % ROOT_EVERY !== 0 || target === undefined || !UnitAlive(target) || isBossWave(this.game)) {
            return;
        }
        BlzPauseUnitEx(target, true);
        const roots = AddSpecialEffectTarget(ROOTS, target, 'origin');
        const timer = CreateTimer()!;
        TimerStart(timer, ROOT_SECONDS, false, () => {
            BlzPauseUnitEx(target, false);
            DestroyEffect(roots!);
            DestroyTimer(timer);
        });
        SyncTrace.note('root', `p${this.owner.id} rooted ${SyncTrace.unit(Unit.fromHandle(target))}`);
    }
}
