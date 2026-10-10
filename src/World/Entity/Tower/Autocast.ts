import {Trigger, Unit} from 'w3ts';
import {DecodeFourCC} from '../../../lib/translators';

// Each tower type with an autocast ability, and the orders that switch it on (scripts/autocast.js)
const AUTOCAST_ORDERS: {[unitId: string]: string[]} = compiletime(({objectData}) =>
    require(require('path').resolve('scripts/autocast.js')).autocastOrders(objectData, 'maps/map.w3x')) as
    {[unitId: string]: string[]};

/**
 * Switches a tower's autocast abilities on (Arachnid's Parasite, Bloodlust, Slow...), which a player
 * would otherwise have to do by hand for every tower they build or upgrade.
 */
export function switchOnAutocast(tower: Unit): void {
    const orders = AUTOCAST_ORDERS[DecodeFourCC(tower.typeId)];
    if (orders === undefined) {
        return;
    }
    for (const order of orders) {
        tower.issueImmediateOrder(order);
    }
}

/**
 * Switches autocast on for units that are not towers as they enter the map: a creep that dies
 * with Arachnid's Parasitic Bite spawns a Scorpasite (n00T, the ability's summoned unit), which has
 * the bite too. Runs on every client, as entering the map is game state.
 */
export function switchOnAutocastForSpawns(): void {
    const world = CreateRegion()!;
    RegionAddRect(world, GetWorldBounds()!);
    const trigger = Trigger.create();
    trigger.registerEnterRegion(world, undefined);
    trigger.addAction(() => {
        const unit = Unit.fromHandle(GetEnteringUnit());
        // Towers are set up first (SetupTower switches theirs on), and one being built takes no orders
        if (unit && !unit.isUnitType(UNIT_TYPE_STRUCTURE)) {
            switchOnAutocast(unit);
        }
    });
}
