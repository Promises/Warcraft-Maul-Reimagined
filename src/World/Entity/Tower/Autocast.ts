import {Unit} from 'w3ts';
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
