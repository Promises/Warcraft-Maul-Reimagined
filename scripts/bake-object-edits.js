#!/usr/bin/env node
/**
 * Bakes fixed object edits into the map's own data (maps/map.w3x), where they had been made at
 * build time in compiletime blocks (tag compiletime-object-edits has them there). Only fixed values
 * that someone chose: what is computed from other data (the hybrid dummy towers, the Primal and
 * Ascended copies, tooltips built from attack data, the autocast table, AC01) stays build-time.
 *
 * Units go through object-data.js (war3-objectdata, as the build itself loads and saves them every
 * time); the new abilities are appended to war3map.w3a and war3mapSkin.w3a by primal-abilities.js,
 * which leaves the existing entries byte for byte. Running it again changes nothing. (The anti-juggle
 * blocker's model and pathing, also set at build time before, were in the map's data already.)
 *
 *   node scripts/bake-object-edits.js
 */
const path = require('path');
const {open} = require('./object-data');
const {addPrimalAbilities} = require('./primal-abilities');

const MAP = path.resolve(__dirname, '..', 'maps/map.w3x');

/** An ability list ("A,B,C") with the given ones taken out and the given ones added at the end, once. */
function abilities(list, remove, add) {
    const kept = String(list || '').split(',').filter(id => id !== '' && remove.indexOf(id) === -1 && add.indexOf(id) === -1);
    return kept.concat(add).join(',');
}

const map = open(MAP);
const unit = map.unit;

// The Elementalists' midgame: Tornado's first aura is Updraft (A03Q, +20% attack speed for your towers
// within 500) where Tailwind (A0E0) sped enemies up; the Depleted Rock is recharged (AP03), not paid
// to go away (A0BF)
unit('u022').normal = String(unit('u022').normal || '').split(',').map(id => id === 'A0E0' ? 'A03Q' : id).join(',');
unit('n027').normal = abilities(unit('n027').normal, ['A0BF'], ['AP03']);
// The Depleted Rock had its base unit's ghoul icon: the Uncharged Rune's, greyed out
unit('n027').iconGameInterface = 'ReplaceableTextures\\CommandButtonsDisabled\\DISBTNMoonStone.blp';
// Bubbles' icon: BTNBubbles by Golden-Drake (hiveworkshop.com/threads/btnbubbles.173114), re-encoded
// because the original's mip table points its small levels at one 32x32 image
unit('u026').iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNBubbles.blp';
// The Primals' ingredients can Siphon Energy (A0CT) onto each other: Undead L2 and Death Rune L3,
// Air Rune L3 and Water Rune L3, Sandstorm L2, two Life Rune L3, Tree and Nature Rune L3, Purgatory
// L2 and Fire Rune L3
for (const id of ['u038', 'u02B', 'u033', 'u035', 'u03D', 'u02D', 'u036', 'u02F', 'u039', 'u031']) {
    unit(id).normal = abilities(unit(id).normal, [], ['A0CT']);
}
// The Corrupted Tree's selection circle was the base unit's 3.25, far wider than the others'
unit('n030').selectionScale = 2.5;
// The Cold Tower's splash reached air only (area targets "air,enemies"), so on a ground wave it hit
// one creep; with ground in its splash its range is 675 (it was 900, and 650 to acquire)
unit('h04B').attack1AreaOfEffectTargets = 'air,enemies,ground';
unit('h04B').attack1Range = 675;
unit('h04B').acquisitionRange = 675;

map.save();

// The Elementalists' Primal abilities (ElementalistPrimals.ts reads their ids as ASCEND, SURGE and RECHARGE)
addPrimalAbilities([
    {
        id: 'AP01', order: 'avatar', name: '[Elementalists] Ascend', tooltip: 'Ascend [|cffffcc00V|r]',
        extended: 'At Attunement 15, this Primal ascends: the Lich into the Lich King (400 gold), the Thunderhead '
            + 'into the Eye of the Storm (500), the Haboob into the Endless Storm (500), the Heart of Life into the '
            + 'Avatar of Life (600), the World Tree into Nordrassil (450), the Inferno into the Firelord (400). An '
            + 'Ascended tower gains 5% of its power every wave it stands, with no cap. One of each Ascended per player.',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNAvatar.blp', hotkey: 'V', x: 1, y: 2,
    },
    {
        id: 'AP02', order: 'berserk', name: '[Elementalists] Surge', tooltip: 'Surge [|cffffcc00G|r]',
        extended: 'Buys one level of Attunement for 60 gold: up to 10 levels over this Primal\'s life, never past 15. '
            + 'The growth after Ascension only comes from waves survived.',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNBloodLust.blp', hotkey: 'G', x: 2, y: 2,
    },
    {
        id: 'AP03', order: 'rejuvination', name: '[Elementalists] Recharge', tooltip: 'Recharge [|cffffcc00R|r]',
        extended: 'Recharges the rock into an Uncharged Rune for 8 gold, which can take an element again.',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNManaRecharge.blp', hotkey: 'R', x: 0, y: 2,
    },
    {
        // A Primal's and an Ascended's own account of itself: AttunedTower writes each tower's tooltip
        // (what it does, and what it has gained) as it grows. A passive in the command card's V slot,
        // so it reads as information and is never taken for Ascend
        id: 'AP04', passive: true, name: '[Elementalists] Power', tooltip: 'Power',
        extended: 'What this tower does, and what it has gained.',
        icon: 'ReplaceableTextures\\PassiveButtons\\PASBTNCommand.blp', x: 3, y: 2,
    },
], MAP);
console.log('baked into', MAP);
