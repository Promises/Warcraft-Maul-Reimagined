import { Tower } from '../../Specs/Tower';
import { GenericAutoAttackTower } from '../../Specs/GenericAutoAttackTower';
import { Unit } from 'w3ts';

const MONSOON = FourCC('A03P');
const DUMMY = FourCC('u008');
// Outlives the monsoon's 12 s channel
const DUMMY_LIFE = 13.00;

export class ForestTrollHighPriest extends Tower implements GenericAutoAttackTower {

    // A dummy casts the monsoon on the attacked unit's spot, so the tower keeps attacking: cast
    // by the tower itself, the monsoon's 12 s channel stopped its attacks, and with a 10 s
    // cooldown it was ready again when the channel ended - the tower's own attack never landed.
    // The tower's monsoon button shows the cooldown.
    public GenericAttack(): void {
        if (BlzGetUnitAbilityCooldownRemaining(this.unit.handle, MONSOON) > 0) {
            return;
        }
        const target = Unit.fromEvent();
        if (!target) {
            return;
        }
        const dummy = Unit.create(this.owner, DUMMY, this.unit.x, this.unit.y, bj_UNIT_FACING);
        if (!dummy) {
            return;
        }
        dummy.applyTimedLife(FourCC('BTLF'), DUMMY_LIFE);
        dummy.addAbility(MONSOON);
        dummy.issueOrderAt('monsoon', target.x, target.y);
        BlzStartUnitAbilityCooldown(this.unit.handle, MONSOON, BlzGetUnitAbilityCooldown(this.unit.handle, MONSOON, 0));
    }

}
