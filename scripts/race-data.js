#!/usr/bin/env node
/**
 * The races and their towers as the map defines them, as JSON: what the automated race tests
 * (wc3-slop-lan's maps/warcraft-maul) check the running game against, read fresh from the map's
 * object data so the tests follow the map as it changes.
 *
 *   node scripts/race-data.js [tier]        e.g. Beginner
 *
 * Races come from WorldMap.setupRaces (builder, name, item, enabled); a race's tier from the
 * first line of its item's tooltip, as RaceItems reads it; its towers are everything its builder
 * builds, and everything those upgrade to. A tower's auras come with their buff, area and targets.
 */
const fs = require('fs');
const path = require('path');
const {loadObjectData} = require('war3-transformer/dist/objectdata');

const ROOT = path.resolve(__dirname, '..');
const MAP = path.join(ROOT, 'maps/map.w3x');
const objectData = loadObjectData(MAP);

// The string table, to resolve TRIGSTR references in names and tooltips
const wts = fs.readFileSync(path.join(MAP, 'war3map.wts'), 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
const strings = {};
for (const match of wts.matchAll(/STRING (\d+)\n(?:\/\/[^\n]*\n)?\{\n([\s\S]*?)\n\}/g)) {
    strings[match[1]] = match[2];
}
const resolve = text => {
    const ref = /^TRIGSTR_(\d+)$/.exec(text || '');
    return ref ? (strings[ref[1]] || '') : (text || '');
};
// Abilities: war3-transformer does not read war3map.w3a, so it is read here - the fields a test
// needs from an aura (base ability, buff, area, targets), level 1
function readAbilities(file) {
    const data = fs.readFileSync(file);
    let pos = 0;
    const u32 = () => { pos += 4; return data.readUInt32LE(pos - 4); };
    const id = () => { pos += 4; return data.toString('latin1', pos - 4, pos); };
    const version = u32();
    const out = new Map();
    for (let table = 0; table < 2; table++) {
        for (let objects = u32(); objects > 0; objects--) {
            const base = id();
            const custom = id();
            const fields = {};
            for (let sets = version >= 3 ? u32() : 1; sets > 0; sets--) {
                if (version >= 3) {
                    u32();
                }
                for (let mods = u32(); mods > 0; mods--) {
                    const field = id();
                    const kind = u32();
                    const level = u32();
                    u32();
                    let value;
                    if (kind === 3) {
                        const end = data.indexOf(0, pos);
                        value = data.toString('latin1', pos, end);
                        pos = end + 1;
                    } else {
                        value = kind === 0 ? data.readInt32LE(pos) : data.readFloatLE(pos);
                        pos += 4;
                    }
                    pos += 4;
                    if (level <= 1) {
                        fields[field] = value;
                    }
                }
            }
            out.set(table === 0 ? base : custom, {base, fields});
        }
    }
    return out;
}
const abilityData = readAbilities(path.join(MAP, 'war3map.w3a'));

// The auras' defaults, as the game's AbilityData.slk has them (level 1): what an aura that does not
// set its own buff, area or targets has
const AURA_DEFAULTS = {
    ACac: {buff: 'BOac', area: 900, targets: 'air,ground,friend,self,vuln,invu'},
    AEar: {buff: 'BEar', area: 900, targets: 'air,ground,friend,self,vuln,invu'},
    AOae: {buff: 'BOae', area: 900, targets: 'air,ground,friend,self,vuln,invu'},
    SCae: {buff: 'BOae', area: 900, targets: 'air,ground,friend,self'},
    AUau: {buff: 'BUau', area: 900, targets: 'air,ground,friend,self,vuln,invu'},
    AHad: {buff: 'BHad', area: 900, targets: 'air,ground,friend,self,vuln,invu'},
    Aakb: {buff: 'Bakb', area: 900, targets: 'air,ground,friend,self,vuln,invu'},
    Aasl: {buff: 'Basl', area: 600, targets: 'air,ground,enemy,vuln,invu'},
};

function aura(abilityId) {
    const ability = abilityData.get(abilityId);
    const base = ability ? ability.base : abilityId;
    const defaults = AURA_DEFAULTS[base];
    if (!defaults) {
        return null;
    }
    const fields = ability ? ability.fields : {};
    return {
        id: abilityId,
        base,
        buff: fields.abuf || defaults.buff,
        area: fields.aare ?? defaults.area,
        targets: list(fields.atar || defaults.targets),
    };
}

const plain = text => resolve(text).replace(/\|c[0-9a-fA-F]{8}|\|r/g, '').replace(/\|n/g, '\n');
const list = value => String(value || '').split(',').map(s => s.trim()).filter(s => s && s !== '_');

function tierOf(itemId) {
    if (['I00V', 'I00W', 'I00X'].includes(itemId)) {
        return 'Random';
    }
    const item = objectData.items.get(itemId);
    const first = item ? plain(item.tooltipExtended).split('\n')[0].trim() : '';
    if (first === 'Secondary Race') {
        return 'Secondary';
    }
    return ['Beginner', 'Intermediate', 'Advanced'].includes(first) ? first : 'Other';
}

function tower(id) {
    const unit = objectData.units.get(id);
    if (!unit) {
        return {id, missing: true};
    }
    const attacks = unit.attacksEnabled & 1 ? {
        type: unit.attack1AttackType,
        weapon: unit.attack1WeaponType,
        damageMin: unit.attack1DamageBase + unit.attack1DamageNumberOfDice,
        damageMax: unit.attack1DamageBase + unit.attack1DamageNumberOfDice * unit.attack1DamageSidesPerDie,
        range: unit.attack1Range,
        cooldown: unit.attack1CooldownTime,
        targets: list(unit.attack1TargetsAllowed),
        splash: unit.attack1AreaOfEffectSmallDamage || 0,
    } : null;
    return {
        id,
        name: plain(unit.name),
        gold: unit.goldCostundefined || 0,
        lumber: unit.lumberCostundefined || 0,
        food: unit.foodCost || 0,
        foodMade: unit.foodProduced || 0,
        requires: list(unit.requirements),
        attacks,
        abilities: list(unit.normal),
        // What each ability is made from (a custom one's base, or itself)
        abilityBases: list(unit.normal).map(ability => abilityData.get(ability)?.base || ability),
        auras: list(unit.normal).map(aura).filter(Boolean),
        upgradesTo: list(unit.upgradesTo),
        tooltip: plain(unit.tooltipExtended),
    };
}

function races() {
    const source = fs.readFileSync(path.join(ROOT, 'src/World/WorldMap.ts'), 'utf8');
    const out = [];
    for (const match of source.matchAll(/new Race\w*\(\s*'(\w{4})',\s*'([^']+)',\s*'(\w{4}|NULL)',\s*this(?:,\s*(true|false))?\)/g)) {
        const [, builder, name, item, enabled] = match;
        const seen = new Set();
        const towers = [];
        const visit = id => {
            if (seen.has(id)) {
                return;
            }
            seen.add(id);
            const data = tower(id);
            towers.push(data);
            (data.upgradesTo || []).forEach(visit);
        };
        list(objectData.units.get(builder)?.structuresBuilt).forEach(visit);
        out.push({builder, name, item, tier: item === 'NULL' ? 'Other' : tierOf(item), enabled: enabled !== 'false', towers});
    }
    return out;
}

const wanted = process.argv[2];
const result = races().filter(race => !wanted || race.tier === wanted);
process.stdout.write(JSON.stringify(result, null, 1) + '\n');
