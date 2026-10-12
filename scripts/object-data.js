#!/usr/bin/env node
/**
 * Reads and edits the map's object data (maps/map.w3x) without the World Editor.
 *
 *   node scripts/object-data.js get unit h04B                  the fields it sets (those not its base unit's)
 *   node scripts/object-data.js get unit h04B attack1Range     one field
 *   node scripts/object-data.js set unit h04B attack1Range 675
 *   node scripts/object-data.js find unit "Cold Tower"         ids whose name has the text
 *   node scripts/object-data.js get ability A09Z               its fields, every level
 *   node scripts/object-data.js get ability A09Z aub1 1        one field at one level
 *   node scripts/object-data.js set ability A0DV Ndt1 1 250
 *
 * Kinds: unit and item (through war3-objectdata, by its field names, e.g. attack1Range; the build
 * loads and saves these the same way every time, so the files come out as the build would write them:
 * checked, no value is lost, an editor-only name suffix moves from the skin file to the data file),
 * destructable to read only (war3-objectdata reads a stock destructable's skin fields as the game's
 * defaults, and on saving drops some of them: the anti-juggle blocker's pathing texture), and ability (by the game's four-letter field ids, e.g. Ndt1, edited in place in
 * war3map.w3a or war3mapSkin.w3a: the object data library does not write abilities, and nothing else
 * in those files changes). A field whose value is a string-table reference (TRIGSTR_n) reads as its
 * text, and setting it changes the text in war3map.wts, so the reference stays. An ability field it
 * does not already set cannot be added here (primal-abilities.js and copy-abilities.js add new
 * abilities).
 *
 * The same, from a script: const map = require('./object-data').open(); map.unit('h04B').attack1Range = 675;
 * map.setAbility('A0DV', 'Ndt1', 1, 250); map.save();
 */
const fs = require('fs');
const path = require('path');

const MAP = path.resolve(__dirname, '..', 'maps/map.w3x');
const KINDS = {unit: 'units', item: 'items', destructable: 'destructables'};
// war3-objectdata writes these files for each kind
const FILES = {
    units: ['war3map.w3u', 'war3mapSkin.w3u', 'w3u', 'w3uSkin'],
    items: ['war3map.w3t', 'war3mapSkin.w3t', 'w3t', 'w3tSkin'],
    destructables: ['war3map.w3b', 'war3mapSkin.w3b', 'w3b', 'w3bSkin'],
};

// --- the string table ------------------------------------------------------------------------------

const STRING_ENTRY = /STRING (\d+)(\r?\n)(?:\/\/[^\r\n]*\r?\n)?\{\r?\n([\s\S]*?)\r?\n\}/g;

function readStrings(dir) {
    const text = fs.readFileSync(path.join(dir, 'war3map.wts'), 'utf8');
    const strings = {};
    for (const match of text.matchAll(STRING_ENTRY)) {
        strings[Number(match[1])] = match[3];
    }
    return strings;
}

function stringRef(value) {
    const match = /^TRIGSTR_(\d+)$/.exec(String(value));
    return match ? Number(match[1]) : undefined;
}

/** Changes one string table entry's text in place. */
function writeString(dir, number, value) {
    const file = path.join(dir, 'war3map.wts');
    const text = fs.readFileSync(file, 'utf8');
    let found = false;
    const changed = text.replace(STRING_ENTRY, (whole, n, newline, body) => {
        if (Number(n) !== number) {
            return whole;
        }
        found = true;
        const start = whole.length - body.length - newline.length - 1;
        return whole.slice(0, start) + value.replace(/\r?\n/g, newline) + whole.slice(start + body.length);
    });
    if (!found) {
        throw new Error(`no STRING ${number} in war3map.wts`);
    }
    fs.writeFileSync(file, changed);
}

// --- abilities, read and edited in place -------------------------------------------------------------

const INT = 0, REAL = 1, UNREAL = 2, STRING = 3;

/** Every field of every custom ability in one file: [{ability, base, field, level, kind, at, end}]. */
function abilityFields(data) {
    let pos = 0;
    const u32 = () => { pos += 4; return data.readUInt32LE(pos - 4); };
    const id = () => { pos += 4; return data.toString('latin1', pos - 4, pos); };
    const fields = [];
    const version = u32();
    for (let table = 0; table < 2; table++) {
        for (let objects = u32(); objects > 0; objects--) {
            const base = id();
            const custom = id();
            for (let sets = version >= 3 ? u32() : 1; sets > 0; sets--) {
                if (version >= 3) {
                    u32();
                }
                for (let mods = u32(); mods > 0; mods--) {
                    const field = id();
                    const kind = u32();
                    const level = u32();
                    u32();
                    const at = pos;
                    pos = kind === STRING ? data.indexOf(0, pos) + 1 : pos + 4;
                    fields.push({ability: custom.charCodeAt(0) ? custom : base, base, field, level, kind, at, end: pos});
                    pos += 4;
                }
            }
        }
    }
    return fields;
}

function fieldValue(data, f) {
    return f.kind === INT ? data.readInt32LE(f.at)
        : f.kind === STRING ? data.toString('latin1', f.at, f.end - 1) : data.readFloatLE(f.at);
}

// --- the map -------------------------------------------------------------------------------------------

/** The map's object data, to read and edit; save() writes what changed. */
function open(dir = MAP) {
    const {loadObjectData} = require('war3-transformer/dist/objectdata');
    const objectData = loadObjectData(dir);
    const strings = readStrings(dir);
    const touched = new Set();
    const abilityFiles = {};
    const abilityFile = name => {
        if (!abilityFiles[name]) {
            abilityFiles[name] = {data: fs.readFileSync(path.join(dir, name)), changed: false};
        }
        return abilityFiles[name];
    };
    const object = (kind, id) => {
        const found = objectData[kind].get(id);
        if (!found) {
            throw new Error(`no ${kind.slice(0, -1)} ${id}`);
        }
        touched.add(kind);
        return found;
    };
    const resolve = value => stringRef(value) !== undefined ? strings[stringRef(value)] : value;

    const map = {
        objectData,
        unit: id => object('units', id),
        item: id => object('items', id),
        // Read only: see set
        destructable: id => objectData.destructables.get(id),

        /** A field's value, a string-table reference read as its text. */
        get(kind, id, field) {
            return resolve(object(KINDS[kind] || kind, id)[field]);
        },

        /** The fields an object sets (those not its base object's): {field: value}. */
        fields(kind, id) {
            const list = KINDS[kind] || kind;
            const found = objectData[list].get(id);
            if (!found) {
                throw new Error(`no ${kind} ${id}`);
            }
            const base = found.oldId && found.oldId !== found.newId ? objectData[list].get(found.oldId) : undefined;
            const out = {};
            for (const key of Object.keys(found)) {
                if (key === 'oldId' || key === 'newId') {
                    continue;
                }
                if (!base || JSON.stringify(found[key]) !== JSON.stringify(base[key])) {
                    out[key] = resolve(found[key]);
                }
            }
            return out;
        },

        /** Sets a field: a string-table text in war3map.wts, any other value on the object. */
        set(kind, id, field, value) {
            if ((KINDS[kind] || kind) === 'destructables') {
                throw new Error('destructables are read only here: war3-objectdata loses skin fields of stock ones on saving');
            }
            const target = object(KINDS[kind] || kind, id);
            const ref = stringRef(target[field]);
            if (ref !== undefined) {
                writeString(dir, ref, String(value));
                strings[ref] = String(value);
                return;
            }
            const current = target[field];
            target[field] = typeof current === 'number' ? Number(value)
                : typeof current === 'boolean' ? (value === true || value === 'true' || value === '1') : value;
        },

        /** Ids of the objects of a kind whose name has the text. */
        find(kind, text) {
            const list = KINDS[kind] || kind;
            const lower = String(text).toLowerCase();
            return Object.keys(objectData[list].map)
                .filter(id => String(resolve(objectData[list].get(id).name) || '').toLowerCase().includes(lower))
                .map(id => `${id} ${resolve(objectData[list].get(id).name)}`);
        },

        /** An ability's fields as the map sets them: [{file, field, level, value}], strings read as their text. */
        ability(id) {
            const out = [];
            for (const name of ['war3map.w3a', 'war3mapSkin.w3a']) {
                const {data} = abilityFile(name);
                for (const f of abilityFields(data).filter(f => f.ability === id)) {
                    out.push({file: name, base: f.base, field: f.field, level: f.level, value: resolve(fieldValue(data, f))});
                }
            }
            return out;
        },

        /** Sets an ability field the map already sets, in place; a string-table text in war3map.wts. */
        setAbility(id, field, level, value) {
            for (const name of ['war3map.w3a', 'war3mapSkin.w3a']) {
                const file = abilityFile(name);
                const f = abilityFields(file.data).find(x => x.ability === id && x.field === field && x.level === Number(level));
                if (!f) {
                    continue;
                }
                if (f.kind === STRING) {
                    const ref = stringRef(fieldValue(file.data, f));
                    if (ref !== undefined) {
                        writeString(dir, ref, String(value));
                        strings[ref] = String(value);
                    } else {
                        // Strings are stored zero-terminated with no length or offset anywhere, so a
                        // longer or shorter one is spliced in and nothing else moves out of place
                        file.data = Buffer.concat([file.data.subarray(0, f.at), Buffer.from(String(value), 'latin1'),
                            file.data.subarray(f.end - 1)]);
                        file.changed = true;
                    }
                } else {
                    if (f.kind === INT) {
                        file.data.writeInt32LE(Math.round(Number(value)), f.at);
                    } else {
                        file.data.writeFloatLE(Number(value), f.at);
                    }
                    file.changed = true;
                }
                return;
            }
            throw new Error(`${id} has no field ${field} at level ${level} (one it does not set cannot be added here)`);
        },

        /** Writes the kinds that were opened or edited, and the ability files that changed. */
        save() {
            const files = objectData.save();
            for (const kind of touched) {
                const [name, skinName, key, skinKey] = FILES[kind];
                if (files[key]) {
                    fs.writeFileSync(path.join(dir, name), files[key].save());
                }
                if (files[skinKey]) {
                    fs.writeFileSync(path.join(dir, skinName), files[skinKey].save());
                }
            }
            for (const [name, file] of Object.entries(abilityFiles)) {
                if (file.changed) {
                    fs.writeFileSync(path.join(dir, name), file.data);
                }
            }
        },
    };
    return map;
}

module.exports = {open, abilityFields, readStrings, writeString, INT, REAL, UNREAL, STRING};

// --- the command line ----------------------------------------------------------------------------------

if (require.main === module) {
    const [command, kind, id, ...rest] = process.argv.slice(2);
    const usage = () => {
        console.error(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 12).map(l => l.replace(/^ \* ?/, '')).join('\n'));
        process.exit(2);
    };
    if (!command || !kind || !id) {
        usage();
    }
    const map = open();
    try {
        if (kind === 'ability') {
            if (command === 'get') {
                const [field, level] = rest;
                const rows = map.ability(id).filter(r => (!field || r.field === field) && (level === undefined || r.level === Number(level)));
                if (rows.length === 0) {
                    throw new Error(`${id}: no such field set`);
                }
                for (const r of rows) {
                    console.log(`${r.field} level ${r.level}: ${r.value}`);
                }
            } else if (command === 'set') {
                const [field, level, value] = rest;
                map.setAbility(id, field, level, value);
                map.save();
                console.log(`${id} ${field} level ${level} = ${value}`);
            } else {
                usage();
            }
        } else if (!KINDS[kind]) {
            usage();
        } else if (command === 'find') {
            console.log(map.find(kind, id).join('\n'));
        } else if (command === 'get') {
            const [field] = rest;
            if (field) {
                console.log(map.get(kind, id, field));
            } else {
                for (const [key, value] of Object.entries(map.fields(kind, id))) {
                    console.log(`${key}: ${value}`);
                }
            }
            if (kind === 'destructable') {
                console.error('(a stock destructable\'s skin fields - model, pathing - read as the game\'s defaults here)');
            }
        } else if (command === 'set') {
            const [field, value] = rest;
            map.set(kind, id, field, value);
            map.save();
            console.log(`${id} ${field} = ${map.get(kind, id, field)}`);
        } else {
            usage();
        }
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
