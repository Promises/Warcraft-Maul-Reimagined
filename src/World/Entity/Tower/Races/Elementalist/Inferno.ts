import {AscendedTower, AttunedTower} from '../../Specs/AttunedTower';
import {TickingTower} from '../../Specs/TickingTower';
import {Tower} from '../../Specs/Tower';

// The tower ticker runs every 0.1 s: a burn a second
const TICKS_A_SECOND = 10;
// One group for every burn: filled, used and cleared within a single call
const nearby: group = CreateGroup()!;

/**
 * A second's burn to every enemy within the area, through the damage engine like any other
 * damage. In code rather than Purgatory's immolation ability, whose damage field could be set per
 * tower but kept its old value in game (measured: 58 a second where 400 was set).
 */
function burn(tower: Tower, damage: number, area: number): void {
    GroupEnumUnitsInRange(nearby, tower.unit.x, tower.unit.y, area, undefined);
    ForGroup(nearby, () => {
        const target = GetEnumUnit()!;
        if (UnitAlive(target) && IsUnitEnemy(target, tower.owner.handle) && !IsUnitType(target, UNIT_TYPE_STRUCTURE)) {
            UnitDamageTarget(tower.unit.handle, target, damage, false, false, ATTACK_TYPE_MAGIC, DAMAGE_TYPE_FIRE,
                WEAPON_TYPE_WHOKNOWS);
        }
    });
    GroupClear(nearby);
}

/**
 * A Primal (Purgatory L2 + Fire Rune L3): burns every enemy within 400 for 400 a second. Its power
 * is the burn, not its attack, so that is what Attunement grows.
 */
export class Inferno extends AttunedTower implements TickingTower {
    public Action(): void {
        burn(this, Math.floor(400 * this.growthShare()), 400);
    }

    public GetTickModulo(): number {
        return TICKS_A_SECOND;
    }

    protected applyDamage(): void {
        // The burn reads its growth each second
    }
}

/** The Inferno, ascended: 900 a second within 450. */
export class Firelord extends AscendedTower implements TickingTower {
    public Action(): void {
        burn(this, Math.floor(900 * this.growthShare()), 450);
    }

    public GetTickModulo(): number {
        return TICKS_A_SECOND;
    }

    protected applyDamage(): void {
        // The burn reads its growth each second
    }
}
