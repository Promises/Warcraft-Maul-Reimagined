/**
 * Copies of existing custom abilities under new ids, with some fields changed, added to the built
 * map's ability files the way primal-abilities.js adds the Primals' (the same appending, which
 * leaves the map's own entries byte for byte). For a tower that needs an ability another tower
 * has, changed, without changing it for that other tower.
 *
 *   copyAbilities([{from: 'A0EU', id: 'AC01', data: {atar: 'air,enemies,ground'}, skin: {anam: 'Frost Attack'}}])
 *
 * Fields in `data` (war3map.w3a) and `skin` (war3mapSkin.w3a) replace the copied ones of that id
 * and level 1, or are added when the source does not set them. Called from a compiletime block,
 * after the build has copied the map to dist.
 */
const fs = require('fs');
const path = require('path');
const W3d = require('mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3d/file').default;
const Modification = require('mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3u/modification').default;
const {append, idInt} = require('./primal-abilities');

const STRING = 3;

/** One object of the source file, as a copy with the new id and the fields changed. */
function copy(file, from, id, fields) {
    const parsed = new W3d();
    parsed.load(fs.readFileSync(file));
    const source = parsed.customTable.objects.find(o => o.newId === from);
    if (!source) {
        throw new Error(`${file}: no ${from} to copy`);
    }
    const modifications = source.modifications.map(m => {
        const c = new Modification();
        Object.assign(c, m);
        c.u1 = idInt(id);
        const changed = fields[m.id];
        if (changed !== undefined && m.levelOrVariation <= 1) {
            c.value = changed;
        }
        return c;
    });
    for (const [field, value] of Object.entries(fields)) {
        if (!source.modifications.some(m => m.id === field)) {
            const c = new Modification();
            c.id = field;
            c.variableType = typeof value === 'string' ? STRING : 0;
            c.levelOrVariation = 1;
            c.dataPointer = 0;
            c.value = value;
            c.u1 = idInt(id);
            modifications.push(c);
        }
    }
    return {oldId: source.oldId, newId: id, modifications};
}

/** Adds the copies to the built map in dist. copies: [{from, id, data, skin}] */
function copyAbilities(copies) {
    const config = JSON.parse(fs.readFileSync(path.resolve('config.json'), 'utf8'));
    const map = path.resolve('dist', config.mapFolder);
    for (const [name, key] of [['war3map.w3a', 'data'], ['war3mapSkin.w3a', 'skin']]) {
        const file = path.join(map, name);
        const objects = copies.map(c => copy(file, c.from, c.id, c[key] || {}));
        append(file, () => objects);
    }
}

module.exports = {copyAbilities};
