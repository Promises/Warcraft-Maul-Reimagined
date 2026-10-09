/**
 * New abilities for the Elementalist's Primals, added to the built map's ability files.
 *
 * The build's object data (war3-transformer) covers units, items, destructables and doodads, not
 * abilities, and running the whole ability file through the object data library would not give
 * the same bytes back. So the new abilities are appended to the copies of war3map.w3a and
 * war3mapSkin.w3a in dist: the map's own entries stay byte for byte, the custom table's count goes
 * up, and the new entries are appended. Their fields are written by the parser the build uses for
 * doodads (whose format abilities share); the object header is written here, because that parser
 * writes a version 3 object's field count before its set flag, where the game (and its own loader)
 * reads the flag first.
 *
 * Each is a Channel (ANcl) with no target and an order of its own - two abilities of one base
 * order on a unit could not both be cast - modelled on Open Lootbox (A0EX). Called from a
 * compiletime block (ElementalistPrimals.ts), after the build has copied the map to dist.
 */
const fs = require('fs');
const path = require('path');
const W3d = require('mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3d/file').default;
const Modification = require('mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3u/modification').default;
const BinaryStream = require('mdx-m3-viewer-th/dist/cjs/common/binarystream').default;

const TEMPLATE = 'A0EX';
const INT = 0, UNREAL = 2, STRING = 3;

function idInt(id) {
    return id.charCodeAt(0) | id.charCodeAt(1) << 8 | id.charCodeAt(2) << 16 | id.charCodeAt(3) << 24;
}

function modification(id, variableType, level, dataPointer, value, owner) {
    const m = new Modification();
    m.id = id;
    m.variableType = variableType;
    m.levelOrVariation = level;
    m.dataPointer = dataPointer;
    m.value = value;
    m.u1 = idInt(owner);
    return m;
}

function object(template, newId, modifications) {
    return {oldId: template.oldId, newId, modifications};
}

/** An object as the game reads it (version 3: one set, flag 0): ids, set count, flag, field count, fields. */
function objectBytes(o) {
    const fields = o.modifications.map(m => {
        const bytes = new Uint8Array(m.getByteLength(true));
        m.save(new BinaryStream(bytes), true);
        return Buffer.from(bytes);
    });
    const header = Buffer.alloc(20);
    header.write(o.oldId, 0, 'latin1');
    header.write(o.newId, 4, 'latin1');
    header.writeUInt32LE(1, 8);
    header.writeUInt32LE(0, 12);
    header.writeUInt32LE(o.modifications.length, 16);
    return Buffer.concat([header].concat(fields));
}

/** The game data: order, cooldown and the rest, level 1 only. */
function data(ability) {
    const id = ability.id;
    return [
        modification('aher', INT, 0, 0, 0, id),
        modification('alev', INT, 0, 0, 1, id),
        modification('acdn', UNREAL, 1, 0, 0, id),
        modification('amcs', INT, 1, 0, 0, id),
        modification('Ncl1', UNREAL, 1, 1, 0, id),
        modification('Ncl2', INT, 1, 2, 0, id),
        modification('Ncl3', INT, 1, 3, 1, id),
        modification('Ncl4', UNREAL, 1, 4, 0, id),
        modification('Ncl5', INT, 1, 5, 0, id),
        modification('Ncl6', STRING, 1, 6, ability.order, id),
    ];
}

/** The skin: name, tooltips, icon, hotkey, button. */
function skin(ability) {
    const id = ability.id;
    return [
        modification('anam', STRING, 0, 0, ability.name, id),
        modification('atp1', STRING, 1, 0, ability.tooltip, id),
        modification('aub1', STRING, 1, 0, ability.extended, id),
        modification('aart', STRING, 0, 0, ability.icon, id),
        modification('ahky', STRING, 0, 0, ability.hotkey, id),
        modification('abpx', INT, 0, 0, ability.x, id),
        modification('abpy', INT, 0, 0, ability.y, id),
    ];
}

/** Appends the abilities' entries to one built ability file, leaving the rest of it as it was. */
function append(file, build) {
    const buffer = fs.readFileSync(file);
    const parsed = new W3d();
    parsed.load(buffer);
    const template = parsed.customTable.objects.find(o => o.newId === TEMPLATE);
    if (!template) {
        throw new Error(`${file}: no ${TEMPLATE} to model the Primal abilities on`);
    }
    const objects = build(template).filter(o => !parsed.customTable.objects.some(existing => existing.newId === o.newId));
    if (objects.length === 0) {
        return;
    }
    if (parsed.version !== 3) {
        throw new Error(`${file}: version ${parsed.version}; the Primal abilities are written as version 3`);
    }
    const countAt = 4 + parsed.originalTable.getByteLength(true, parsed.version);
    const out = Buffer.concat([buffer].concat(objects.map(objectBytes)));
    out.writeUInt32LE(buffer.readUInt32LE(countAt) + objects.length, countAt);
    fs.writeFileSync(file, out);
}

/** Adds the abilities to the built map in dist. abilities: [{id, order, name, tooltip, extended, icon, hotkey, x, y}] */
function addPrimalAbilities(abilities) {
    const config = JSON.parse(fs.readFileSync(path.resolve('config.json'), 'utf8'));
    const map = path.resolve('dist', config.mapFolder);
    append(path.join(map, 'war3map.w3a'), template => abilities.map(a => object(template, a.id, data(a))));
    append(path.join(map, 'war3mapSkin.w3a'), template => abilities.map(a => object(template, a.id, skin(a))));
}

module.exports = {addPrimalAbilities, append, idInt, objectBytes};
