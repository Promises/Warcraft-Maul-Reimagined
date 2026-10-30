import {Util} from '../../lib/translators';

/**
 * Per-creep gold bounty, read from the unit object data at build time: the engine's own formula
 * of base + (NumberOfDice d SidesPerDie). The engine's automatic bounty is turned OFF (see
 * Attacker, GIVES_BOUNTY = 0) so the map can split it; instead the bounty is rolled on death and
 * shared 60% to the creep's spawn-lane holder and 40% to the killer
 * (see SpawnedCreeps.RemoveDeadCreeps).
 */
export interface Bounty {
    base: number;
    dice: number;
    sides: number;
}

/**
 * Built at compile time as a flat list of [typeId, base, dice, sides] (a plain array serialises
 * cleanly), then turned into a Map below so the lookup key is the numeric unit type id the game
 * reports at runtime. Only units that actually award gold are included.
 */
const BOUNTY_DATA: Array<[number, number, number, number]> = compiletime(({objectData, fourCC}) => {
    const out: Array<[number, number, number, number]> = [];
    for (const id of Object.keys(objectData.units.map)) {
        const unit = objectData.units.get(id);
        if (!unit) {
            continue;
        }
        const base = Number(unit.goldBountyAwardedBase ?? 0);
        const dice = Number(unit.goldBountyAwardedNumberOfDice ?? 0);
        const sides = Number(unit.goldBountyAwardedSidesPerDie ?? 0);
        if (base > 0 || (dice > 0 && sides > 0)) {
            out.push([fourCC(id), base, dice, sides]);
        }
    }
    return out;
}) as Array<[number, number, number, number]>;

const CREEP_BOUNTIES: Map<number, Bounty> = (() => {
    const map = new Map<number, Bounty>();
    for (const entry of BOUNTY_DATA) {
        map.set(entry[0], {base: entry[1], dice: entry[2], sides: entry[3]});
    }
    return map;
})();

/**
 * Rolls a creep's gold bounty the way the engine would (base + dice d sides) using the map's
 * synced RNG, so every client computes the same amount and the split stays in lockstep. Returns
 * 0 for a type that awards no gold.
 */
export function rollBounty(typeId: number): number {
    const bounty = CREEP_BOUNTIES.get(typeId);
    if (bounty === undefined) {
        return 0;
    }
    let gold = bounty.base;
    for (let i = 0; i < bounty.dice; i++) {
        gold += Util.RandomInt(1, bounty.sides);
    }
    return gold;
}
