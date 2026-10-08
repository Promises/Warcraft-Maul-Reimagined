import {Unit} from 'w3ts';
import {Tower} from '../../Specs/Tower';
import {AttackActionTower} from '../../Specs/AttackActionTower';
import {Defender} from '../../../Players/Defender';
import {WarcraftMaul} from '../../../../WarcraftMaul';

// What Mist does to what it hits: it takes this much more magic damage, from anyone, for a while
const MAGIC_TAKEN = 1.1;
const MARK_TICKS = 100;
const TICK_SECONDS = 0.1;
// Marks of creeps that died are dropped once there are this many
const PRUNE_AT = 200;

// Every Mist shares one clock and one list: a target is marked once, however many Mists hit it
const marks: Map<unit, number> = new Map<unit, number>();
let now = 0;
let installed = false;

function install(game: WarcraftMaul): void {
    if (installed) {
        return;
    }
    installed = true;
    TimerStart(CreateTimer()!, TICK_SECONDS, true, () => {
        now++;
    });
    game.gameDamageEngine.AddMultiplicativeDamageModificationEvent(() => {
        const globals = game.gameDamageEngineGlobals;
        const target = globals.udg_DamageEventTarget;
        const until = target === undefined ? undefined : marks.get(target);
        if (until === undefined) {
            return;
        }
        if (until <= now) {
            marks.delete(target!);
        } else if (globals.udg_DamageEventAttackT === GetHandleId(ATTACK_TYPE_MAGIC)) {
            globals.udg_DamageEventAmount *= MAGIC_TAKEN;
        }
    });
}

function prune(): void {
    const expired: unit[] = [];
    marks.forEach((until, target) => {
        if (until <= now || !UnitAlive(target)) {
            expired.push(target);
        }
    });
    for (const target of expired) {
        marks.delete(target);
    }
}

/** Water + Fire: whatever its attack hits takes 10% more magic damage, from anyone, for 10 seconds. */
export class Mist extends Tower implements AttackActionTower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        install(game);
    }

    public AttackAction(): void {
        const globals = this.game.gameDamageEngineGlobals;
        const target = globals.udg_DamageEventTarget;
        if (globals.udg_DamageEventSource !== this.unit.handle || globals.udg_IsDamageSpell || target === undefined) {
            return;
        }
        if (marks.size >= PRUNE_AT) {
            prune();
        }
        marks.set(target, now + MARK_TICKS);
    }
}
