/**
 * The towers whose abilities are cast automatically once switched on (Parasite, Bloodlust, Slow...),
 * with the order that switches each on: read at build time from the map's object data, so a tower
 * that gets such an ability needs nothing more. src/World/Entity/Tower/Autocast.ts issues the orders
 * as a tower is set up, so its autocast is on from the start, as a player would otherwise have to do.
 */
const fs = require('fs');
const path = require('path');

// The game's autocast abilities a tower has, by base ability, and the order that turns each on
const ON_ORDERS = {
    ACpa: 'parasiteon', // Parasite (creep)
    Ablo: 'bloodluston', // Bloodlust
    ACbl: 'bloodluston', // Bloodlust (creep)
    ACif: 'innerfireon', // Inner Fire (creep)
    ACrd: 'raisedeadon', // Raise Dead (creep)
    AHca: 'coldarrows', // Cold Arrows
    // Not Slow (creep), ACsw: the game refuses slowon for it (the Dragons' Slow; their class casts it)
};

/** {ability id: base id} of the map's custom abilities (war3map.w3a; war3-transformer does not read it). */
function abilityBases(file) {
    const data = fs.readFileSync(file);
    let pos = 0;
    const u32 = () => { pos += 4; return data.readUInt32LE(pos - 4); };
    const id = () => { pos += 4; return data.toString('latin1', pos - 4, pos); };
    const version = u32();
    const bases = {};
    for (let table = 0; table < 2; table++) {
        const count = u32();
        for (let o = 0; o < count; o++) {
            const base = id();
            const custom = id();
            const sets = version >= 3 ? u32() : 1;
            for (let s = 0; s < sets; s++) {
                if (version >= 3) {
                    u32();
                }
                const fields = u32();
                for (let f = 0; f < fields; f++) {
                    id();
                    const type = u32();
                    u32();
                    u32();
                    if (type === 3) {
                        pos = data.indexOf(0, pos) + 1;
                    } else {
                        pos += 4;
                    }
                    id();
                }
            }
            bases[custom.charCodeAt(0) ? custom : base] = base;
        }
    }
    return bases;
}

/** {unit id: [orders]} for every unit type with an autocast ability. */
function autocastOrders(objectData, mapDir) {
    const bases = abilityBases(path.join(mapDir, 'war3map.w3a'));
    const orders = {};
    for (const unitId of Object.keys(objectData.units.map)) {
        const unit = objectData.units.get(unitId);
        const found = String(unit.normal || '').split(',')
            .map(ability => ON_ORDERS[bases[ability] || ability])
            .filter(order => order !== undefined);
        if (found.length > 0) {
            orders[unitId] = found;
        }
    }
    return orders;
}

module.exports = {autocastOrders, abilityBases, ON_ORDERS};
