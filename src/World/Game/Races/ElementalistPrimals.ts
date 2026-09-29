import {Unit} from "war3-objectdata-th";

/**
 * The Elementalist's Primal fusions (the Elementalist redesign), made at build time from the
 * mature pieces they fuse: new unit types, so they need no World Editor save. Siphon Energy (A0CT)
 * is added to the mature pieces a Primal is made of, so they can fuse.
 */
export const {LICH, THUNDERHEAD, PRIMAL_INGREDIENTS} = compiletime(({objectData}) => {
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
    // with chaos damage for the bosses' Hero armour, and the Air Rune's look until it has its own
    const thunderhead = objectData.units.copy(objectData.units.get('h00L')!, 'uP02')!;
    const airRune: Unit = objectData.units.get('u033')!;
    thunderhead.name = 'Thunderhead';
    thunderhead.modelFile = airRune.modelFile;
    thunderhead.scalingValueundefined = airRune.scalingValueundefined;
    thunderhead.iconGameInterface = airRune.iconGameInterface;
    thunderhead.attack1AttackType = 'chaos';
    thunderhead.attack1DamageBase = 1450;
    thunderhead.attack1AreaOfEffectFullDamage = 700;
    thunderhead.tooltipBasic = 'Thunderhead';
    thunderhead.tooltipExtended = 'A Primal fusion of an Air Rune Level 3 and a Water Rune Level 3 (Siphon Energy, 600 gold). '
        + 'One per player.|n|nAttacks air only: about 1,500 chaos damage, range 1,000, 700 splash against air, as fast '
        + 'as the Dalaran Guard Tower. Gains Attunement: 2% of its base damage per wave it stands, up to 15.';
    return {LICH: lich.newId, THUNDERHEAD: thunderhead.newId, PRIMAL_INGREDIENTS: ingredients};
}) as {LICH: string, THUNDERHEAD: string, PRIMAL_INGREDIENTS: string[]};
