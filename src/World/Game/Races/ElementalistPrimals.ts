import {Unit} from "war3-objectdata-th";

// The Primals' own abilities (scripts/primal-abilities.js adds them to the built map)
export const ASCEND = 'AP01';
export const SURGE = 'AP02';

/**
 * The Elementalist's Primal fusions and their Ascended forms (the Elementalist redesign), made at
 * build time from the towers they come from: new unit types, so they need no World Editor save.
 * Siphon Energy (A0CT) is added to the mature pieces a Primal is made of, so they can fuse, and
 * Ascend and Surge to the Primals.
 */
export const {LICH, THUNDERHEAD, LICH_KING, EYE_OF_THE_STORM, PRIMAL_INGREDIENTS} = compiletime(({objectData}) => {
    // Ascend and Surge: the ids are the ASCEND and SURGE above (compiletime code cannot see them)
    require(require('path').resolve('scripts/primal-abilities.js')).addPrimalAbilities([
        {
            id: 'AP01', order: 'avatar', name: '[Elementalists] Ascend', tooltip: 'Ascend [|cffffcc00V|r]',
            extended: 'At Attunement 15, this Primal ascends: a Lich becomes the Lich King (400 gold), a Thunderhead the '
                + 'Eye of the Storm (500 gold). An Ascended tower gains 5% of its base damage every wave it stands, '
                + 'with no cap. One of each Ascended per player.',
            icon: 'ReplaceableTextures\\CommandButtons\\BTNAvatar.blp', hotkey: 'V', x: 1, y: 2,
        },
        {
            id: 'AP02', order: 'berserk', name: '[Elementalists] Surge', tooltip: 'Surge [|cffffcc00G|r]',
            extended: 'Buys one level of Attunement for 60 gold: up to 10 levels over this Primal\'s life, never past 15. '
                + 'The growth after Ascension only comes from waves survived.',
            icon: 'ReplaceableTextures\\CommandButtons\\BTNBloodLust.blp', hotkey: 'G', x: 2, y: 2,
        },
    ]);

    // Undead L2 and Death Rune L3: the Lich; Air Rune L3 and Water Rune L3: Thunderhead
    const ingredients = ['u038', 'u02B', 'u033', 'u035'];
    for (const id of ingredients) {
        const unit: Unit | undefined = objectData.units.get(id);
        if (unit && String(unit.normal ?? '').split(',').indexOf('A0CT') === -1) {
            unit.normal = String(unit.normal ?? '').split(',').concat('A0CT').join(',');
        }
    }

    // Copied as an object, not by id: a copy by id of a custom unit would name that unit as its base.
    // A fixed id of its own (Primals are uP..), so it stays the same from build to build
    const lich = objectData.units.copy(objectData.units.get('u038')!, 'uP01')!;
    lich.name = 'Lich';
    lich.modelFile = 'units\\undead\\Lich\\Lich';
    lich.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNLichVersion2.blp';
    lich.attack1Range = 600;
    lich.acquisitionRange = 600;
    lich.attack1WeaponType = 'missile';
    lich.attack1ProjectileArt = 'Abilities\\Weapons\\LichMissile\\LichMissile.mdl';
    lich.attack1ProjectileSpeed = 900;
    // Undead L2's abilities but its upgrade (A0E6)
    lich.normal = String(lich.normal ?? '').split(',').filter(id => id !== 'A0E6' && id !== 'A0CT').join(',');
    lich.tooltipBasic = 'Lich';
    lich.tooltipExtended = 'A Primal fusion of Undead Level 2 and a Death Rune Level 3 (Siphon Energy, 250 gold).|n|n'
        + 'Keeps all the damage the Undead gained, attacks from range 600, and gains 100 damage every wave, '
        + 'plus Attunement: 2% of its base damage per wave it stands, up to 15.';

    // Thunderhead: the Dalaran Guard Tower's weapon (splash, air only, the same attack animation),
    // with chaos damage for the bosses' Hero armour. Model and icon: Pandarian Storm Spire by Remixer
    // (hiveworkshop.com/threads/pandarian-storm-spire.312366), in war3mapImported and
    // ReplaceableTextures; its lightning ball flies from the spire's top, as the model wants
    const thunderhead = objectData.units.copy(objectData.units.get('h00L')!, 'uP02')!;
    thunderhead.name = 'Thunderhead';
    thunderhead.modelFile = 'war3mapImported\\PandarianStormSpire.mdx';
    thunderhead.scalingValueundefined = 1;
    thunderhead.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNStormSpire.blp';
    thunderhead.attack1ProjectileArt = 'Abilities\\Weapons\\FarseerMissile\\FarseerMissile.mdl';
    thunderhead.attack1ProjectileSpeed = 1500;
    thunderhead.projectileLaunchZ = 200;
    thunderhead.attack1AttackType = 'chaos';
    thunderhead.attack1DamageBase = 1450;
    thunderhead.attack1AreaOfEffectFullDamage = 700;
    thunderhead.tooltipBasic = 'Thunderhead';
    thunderhead.tooltipExtended = 'A Primal fusion of an Air Rune Level 3 and a Water Rune Level 3 (Siphon Energy, 600 gold).'
        + '|n|nAttacks air only: about 1,500 chaos damage, range 1,000, 700 splash against air, as fast '
        + 'as the Dalaran Guard Tower. Gains Attunement: 2% of its base damage per wave it stands, up to 15.';
    // The Primals can Ascend and Surge
    for (const primal of [lich, thunderhead]) {
        primal.normal = String(primal.normal ?? '').split(',').concat('AP01', 'AP02').join(',');
    }

    // The Ascended: copies of their Primal, without Ascend and Surge
    const withoutPrimalAbilities = (normal: string | undefined) =>
        String(normal ?? '').split(',').filter(id => id !== 'AP01' && id !== 'AP02').join(',');
    const lichKing = objectData.units.copy(lich, 'uA01')!;
    lichKing.name = 'Lich King';
    lichKing.normal = withoutPrimalAbilities(lichKing.normal);
    lichKing.attack1Range = 700;
    lichKing.acquisitionRange = 700;
    lichKing.tooltipBasic = 'Lich King';
    lichKing.tooltipExtended = 'The Lich, ascended (400 gold). Keeps all it gained, attacks from range 700, gains 160 '
        + 'damage every wave, and 5% of its base damage every wave it stands, with no cap.';
    const eye = objectData.units.copy(thunderhead, 'uA02')!;
    eye.name = 'Eye of the Storm';
    eye.normal = withoutPrimalAbilities(eye.normal);
    eye.attack1DamageBase = 2050;
    eye.attack1Range = 1100;
    eye.acquisitionRange = 1100;
    eye.attack1AreaOfEffectFullDamage = 900;
    eye.tooltipBasic = 'Eye of the Storm';
    eye.tooltipExtended = 'The Thunderhead, ascended (500 gold). Attacks air only: about 2,100 chaos damage, range 1,100, '
        + '900 splash against air. Gains 5% of its base damage every wave it stands, with no cap.';

    return {LICH: lich.newId, THUNDERHEAD: thunderhead.newId, LICH_KING: lichKing.newId, EYE_OF_THE_STORM: eye.newId,
        PRIMAL_INGREDIENTS: ingredients};
}) as {LICH: string, THUNDERHEAD: string, LICH_KING: string, EYE_OF_THE_STORM: string, PRIMAL_INGREDIENTS: string[]};
