#!/usr/bin/env node
/**
 * Reads or sets one field of a custom ability in the map's war3map.w3a, in place: the bytes of
 * the value change and nothing else does. For tuning an ability without the World Editor (the
 * build's object data covers units, not abilities, and re-saving the whole file through a parser
 * does not give the same bytes back). Only a field the ability already has can be set.
 *
 *   node scripts/ability-field.js <ability> <field> <level>            prints the value
 *   node scripts/ability-field.js <ability> <field> <level> <value>    sets it
 *
 * e.g. node scripts/ability-field.js A038 Icfd 1 20
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'maps/map.w3x/war3map.w3a');
const [ability, field, level, value] = process.argv.slice(2);
if (!ability || !field || level === undefined) {
    console.error('usage: ability-field.js <ability> <field> <level> [value]');
    process.exit(2);
}

const data = fs.readFileSync(FILE);
let pos = 0;
const u32 = () => { pos += 4; return data.readUInt32LE(pos - 4); };
const id = () => { pos += 4; return data.toString('latin1', pos - 4, pos); };

// The format as the game reads it (race-data.js reads it the same way): a version, then the
// original and the custom table; each object is its base and new id, (version 3) its sets, and
// its fields: id, type, level, data pointer, value, and the object's id again
const version = u32();
let found;
for (let table = 0; table < 2; table++) {
    for (let objects = u32(); objects > 0; objects--) {
        id();
        const custom = id();
        for (let sets = version >= 3 ? u32() : 1; sets > 0; sets--) {
            if (version >= 3) {
                u32();
            }
            for (let mods = u32(); mods > 0; mods--) {
                const fieldId = id();
                const kind = u32();
                const fieldLevel = u32();
                u32();
                const at = pos;
                if (kind === 3) {
                    pos = data.indexOf(0, pos) + 1;
                } else {
                    pos += 4;
                }
                pos += 4;
                if (custom === ability && fieldId === field && fieldLevel === Number(level)) {
                    found = {at, kind};
                }
            }
        }
    }
}
if (!found) {
    console.error(`${ability} has no field ${field} at level ${level}`);
    process.exit(1);
}
const read = () => found.kind === 0 ? data.readInt32LE(found.at)
    : found.kind === 3 ? data.toString('latin1', found.at, data.indexOf(0, found.at)) : data.readFloatLE(found.at);
const before = read();
if (value === undefined) {
    console.log(`${ability} ${field} level ${level}: ${before}`);
    process.exit(0);
}
if (found.kind === 3) {
    console.error('setting a string field is not supported: its length would change');
    process.exit(1);
}
if (found.kind === 0) {
    data.writeInt32LE(Number(value), found.at);
} else {
    data.writeFloatLE(Number(value), found.at);
}
fs.writeFileSync(FILE, data);
console.log(`${ability} ${field} level ${level}: ${before} -> ${read()}`);
