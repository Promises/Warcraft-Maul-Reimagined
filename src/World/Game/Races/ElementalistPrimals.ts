import {Unit} from "war3-objectdata-th";

// The Primals' own abilities (scripts/primal-abilities.js adds them to the built map)
export const ASCEND = 'AP01';
export const SURGE = 'AP02';
// The Depleted Rock's: 8 gold turns it back into an Uncharged Rune (in place of Pay the Toll)
export const RECHARGE = 'AP03';
export const RECHARGE_PRICE = 8;

/**
 * The Elementalist's Primal fusions and their Ascended forms (the Elementalist redesign), made at
 * build time from the towers they come from: new unit types, so they need no World Editor save.
 * Siphon Energy (A0CT) is added to the mature pieces a Primal is made of, so they can fuse, and
 * Ascend and Surge to the Primals.
 */
export const {LICH, THUNDERHEAD, HABOOB, HEART_OF_LIFE, WORLD_TREE, INFERNO, LICH_KING, EYE_OF_THE_STORM, ENDLESS_STORM,
    AVATAR_OF_LIFE, NORDRASSIL, FIRELORD, PRIMAL_INGREDIENTS} = compiletime(({objectData}) => {
    // Ascend and Surge: the ids are the ASCEND and SURGE above (compiletime code cannot see them)
    require(require('path').resolve('scripts/primal-abilities.js')).addPrimalAbilities([
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
    ]);

    // The midgame: Tornado's first aura is Updraft (an Endurance Aura, +20% attack speed for your towers
    // within 500) where Tailwind sped enemies up; the Depleted Rock is recharged, not paid to go away
    const tornado = objectData.units.get('u022')!;
    tornado.normal = String(tornado.normal ?? '').split(',').map(id => id === 'A0E0' ? 'A03Q' : id).join(',');
    const rock = objectData.units.get('n027')!;
    rock.normal = String(rock.normal ?? '').split(',').filter(id => id !== 'A0BF').concat('AP03').join(',');

    // Undead L2 and Death Rune L3: the Lich; Air Rune L3 and Water Rune L3: Thunderhead; Sandstorm L2
    // and Air Rune L3: Haboob; two Life Rune L3: Heart of Life; Tree and Nature Rune L3: World Tree;
    // Purgatory L2 and Fire Rune L3: Inferno
    const ingredients = ['u038', 'u02B', 'u033', 'u035', 'u03D', 'u02D', 'u036', 'u02F', 'u039', 'u031'];
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
    // Placeholder models from the game's own art until each gets one of its own (see the design doc)
    const primal = (from: string, id: string, name: string, extended: string) => {
        const unit = objectData.units.copy(objectData.units.get(from)!, id)!;
        unit.name = name;
        unit.tooltipBasic = name;
        unit.tooltipExtended = extended;
        return unit;
    };
    const attunement = 'Gains Attunement: 2% of its power per wave it stands, up to 15.';

    // Haboob: Sandstorm L2's many-target attack (its Barrage is set to 8 targets and 500 range per
    // tower, Haboob.ts), harder and further
    const haboob = primal('u03D', 'uP03', 'Haboob', 'A Primal fusion of Sandstorm Level 2 and an Air Rune Level 3 '
        + '(Siphon Energy, 400 gold).|n|nHits up to 8 targets, air and ground: 1,300 chaos damage, range 500. ' + attunement);
    // Model: Sand Elemental by MiniMage and icewolf055 (hiveworkshop.com/threads/sandelemental.244919)
    haboob.modelFile = 'war3mapImported\\SandElemental.mdx';
    haboob.scalingValueundefined = 0.8;
    haboob.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNTornado.blp';
    haboob.attack1DamageBase = 1299;
    haboob.attack1Range = 500;
    haboob.acquisitionRange = 500;

    // Heart of Life: two Life Rune L3, the race's boss killer: melee, one target, a heavy hit
    const heart = primal('u02D', 'uP04', 'Heart of Life', 'A Primal fusion of two Life Rune Level 3 '
        + '(Siphon Energy, 500 gold).|n|nA boss killer: melee, one target, 4,300 normal damage a second. ' + attunement);
    // Model: Heart Crystal by Tranquil (hiveworkshop.com/threads/generators.277141); its crystal takes the
    // player's colour
    heart.modelFile = 'war3mapImported\\HeartCrystal.mdx';
    heart.scalingValueundefined = 0.9;
    heart.attack1DamageBase = 4299;

    // World Tree: Nature Rune L3's siege attack with splash
    const worldTree = primal('u02F', 'uP05', 'World Tree', 'A Primal fusion of a Tree and a Nature Rune Level 3 '
        + '(Siphon Energy, 400 gold).|n|nGround splash: 1,400 siege damage a second, range 800, 250 splash. ' + attunement);
    // The game's Ancient Protector: a tree that hurls boulders, which is what a siege splash looks like
    worldTree.modelFile = 'buildings\\nightelf\\AncientProtector\\AncientProtector';
    worldTree.scalingValueundefined = 0.8;
    worldTree.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNTreeOfLife.blp';
    worldTree.attack1WeaponType = 'msplash';
    worldTree.attack1DamageBase = 1399;
    worldTree.attack1CooldownTime = 1;
    worldTree.attack1AreaOfEffectFullDamage = 250;
    worldTree.attack1AreaOfEffectMediumDamage = 250;
    worldTree.attack1AreaOfEffectSmallDamage = 250;
    worldTree.attack1AreaOfEffectTargets = 'ground,enemies';

    // Inferno: Purgatory L2's burn, far hotter and wider. The burn is in code (Inferno.ts), so
    // Purgatory's immolation ability goes
    const inferno = primal('u039', 'uP06', 'Inferno', 'A Primal fusion of Purgatory Level 2 and a Fire Rune Level 3 '
        + '(Siphon Energy, 350 gold).|n|nImmolation: 400 damage a second to every enemy within 400. For clumped '
        + 'ground waves; weak on bosses. ' + attunement);
    // The Lava Spawn: red fire (the Infernal burns fel green, which reads as demon)
    inferno.modelFile = 'Units\\Creeps\\LavaSpawn\\LavaSpawn';
    inferno.scalingValueundefined = 1.2;
    inferno.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNLavaSpawn.blp';
    inferno.normal = String(inferno.normal ?? '').split(',').filter(id => id !== 'A0E7').join(',');

    // The Primals can Ascend and Surge
    for (const primal of [lich, thunderhead, haboob, heart, worldTree, inferno]) {
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
    // The Ascended keep their Attunement (15, +30%), so their bases are the design's damage at
    // ascension over 1.3: the Eye starts at Dalaran's 2,050 a hit, not 30% past it
    eye.attack1DamageBase = 1576;
    eye.attack1Range = 1100;
    eye.acquisitionRange = 1100;
    eye.attack1AreaOfEffectFullDamage = 900;
    eye.tooltipBasic = 'Eye of the Storm';
    eye.tooltipExtended = 'The Thunderhead, ascended (500 gold). Attacks air only: about 2,100 chaos damage, range 1,100, '
        + '900 splash against air. Gains 5% of its base damage every wave it stands, with no cap.';

    const ascended = (from: Unit, id: string, name: string, extended: string) => {
        const unit = objectData.units.copy(from, id)!;
        unit.name = name;
        unit.normal = withoutPrimalAbilities(unit.normal);
        unit.tooltipBasic = name;
        unit.tooltipExtended = extended;
        return unit;
    };
    const uncapped = 'Gains 5% of its power every wave it stands, with no cap.';
    const endlessStorm = ascended(haboob, 'uA03', 'Endless Storm', 'The Haboob, ascended (500 gold). Hits up to 8 '
        + 'targets, air and ground: 2,000 chaos damage, range 500. ' + uncapped);
    endlessStorm.attack1DamageBase = 1537;
    // Model and icon: Al'Akir by Explobomb (hiveworkshop.com/threads/elemental-lords-pack.360451)
    endlessStorm.modelFile = 'war3mapImported\\AlAkir.mdx';
    endlessStorm.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNIconAlAkir.blp';
    endlessStorm.scalingValueundefined = 0.95;
    const avatar = ascended(heart, 'uA04', 'Avatar of Life', 'The Heart of Life, ascended (600 gold). Melee, one '
        + 'target, 9,000 normal damage a second, and half again against bosses. ' + uncapped);
    avatar.attack1DamageBase = 6922;
    // Model: Demigod Cenarius by FerSZ (hiveworkshop.com/threads/demigod-cenarius-keeper-of-the-groove.309948)
    avatar.modelFile = 'war3mapImported\\CenariusTeamColor.mdx';
    avatar.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNKeeperOfTheGrove.blp';
    avatar.scalingValueundefined = 1.1;
    const nordrassil = ascended(worldTree, 'uA05', 'Nordrassil', 'The World Tree, ascended (450 gold). Ground splash: '
        + '3,000 siege damage a second, range 900, 300 splash; every fifth attack roots its target for a second '
        + '(not bosses). ' + uncapped);
    // The Tree of Eternity: there is no model of its own, it is the Tree of Life's second upgrade
    nordrassil.modelFile = 'buildings\\nightelf\\TreeofLife\\TreeofLife';
    nordrassil.requiredAnimationNames = 'Upgrade,Second';
    nordrassil.scalingValueundefined = 0.95;
    nordrassil.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNTreeOfEternity.blp';
    nordrassil.attack1DamageBase = 2307;
    nordrassil.attack1Range = 900;
    nordrassil.acquisitionRange = 900;
    nordrassil.attack1AreaOfEffectFullDamage = 300;
    nordrassil.attack1AreaOfEffectMediumDamage = 300;
    nordrassil.attack1AreaOfEffectSmallDamage = 300;
    const firelord = ascended(inferno, 'uA06', 'Firelord', 'The Inferno, ascended (400 gold). Immolation: 900 damage '
        + 'a second to every enemy within 450. ' + uncapped);
    // The game's own Firelord
    firelord.modelFile = 'Units\\Creeps\\HeroFlameLord\\HeroFlameLord';
    firelord.iconGameInterface = 'ReplaceableTextures\\CommandButtons\\BTNHeroAvatarOfFlame.blp';
    firelord.scalingValueundefined = 1.0;

    return {LICH: lich.newId, THUNDERHEAD: thunderhead.newId, HABOOB: haboob.newId, HEART_OF_LIFE: heart.newId,
        WORLD_TREE: worldTree.newId, INFERNO: inferno.newId, LICH_KING: lichKing.newId, EYE_OF_THE_STORM: eye.newId,
        ENDLESS_STORM: endlessStorm.newId, AVATAR_OF_LIFE: avatar.newId, NORDRASSIL: nordrassil.newId,
        FIRELORD: firelord.newId, PRIMAL_INGREDIENTS: ingredients};
}) as {LICH: string, THUNDERHEAD: string, HABOOB: string, HEART_OF_LIFE: string, WORLD_TREE: string, INFERNO: string,
    LICH_KING: string, EYE_OF_THE_STORM: string, ENDLESS_STORM: string, AVATAR_OF_LIFE: string, NORDRASSIL: string,
    FIRELORD: string, PRIMAL_INGREDIENTS: string[]};
