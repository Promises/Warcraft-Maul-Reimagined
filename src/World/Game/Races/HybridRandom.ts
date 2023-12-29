import {HybridTower} from "./HybridRandom.types";

/**
 * Generates the hybrid random settings during build time
 */

export const {
    HybridTierOne,
    HybridTierTwo,
    HybridTierThree,
    HybridTierFour,
    HybridTierFive,
    HybridTierSix,
    HybridTierSeven,
    HybridTierEight,
    HybridTierNine
} = compiletime(({objectData, constants}) => {
    const TEMP_HYBRID_RANDOM_ARR = [
        'u00C', // [Forsaken] - Tombstone
        'u00D', // [Forsaken] - Necromancer
        'u00E', // [Forsaken] - Abomination
        'u00F', // [Forsaken] - Gargoyle Spire
        'h00Z', // [Dragons] - Dragonkin
        'h011', // [Goblins] - Pocket Factory
        'h010', // [Dragons] - Dragon Egg
        'o01R', // [Goblins] - Goblin Minelayer
        'o01M', // [Goblins] - Sappers
        'o01N', // [Goblins] - Shredder
        'h03W', // [Demon] - Felguard
        'hC66', // [Humans] - Tower
        'hC21', // [Undead] - Ghast
        'o003', // [Outland] - Chaos Grunt
        'o009', // [High Elven] - Elven Swordsman
        'oC14', // [Giants] - Sasquatch
        'h01C', // [Tavern] - Centaur Outrunner
        'n009', // [Corrupt N.Elves] - Corrupted Moon Well
        'n03D', // [Forest Trolls] - Forest Troll
        'n055', // [Caerbannog] - French Soldier
        'n029', // [Gnolls] - Gnoll
        'n01Y', // [Critters] - Mazing Tower
        'n05H', // [Dwarves] - Undead Dwarf
        'h02H', // [Uniques] - Marine
        'h01Z', // [Summons] - Spirit Wolf
        'h03D', // [Draenei] - Draenei Hut
        'hC27', // [Undead] - Crypt Fiend
        'hC08', // [Humans] - Knight
        'o004', // [Outland] - Nether Drake Hatchling
        'oC18', // [Aviaries] - Gargoyle
        'oC19', // [Orc Stronghold] - Headhunter
        'o00A', // [High Elven] - High Elf Archer
        'oC35', // [Giants] - Ogre Warrior
        'n00O', // [Corrupt N.Elves] - Corrupted Ent
        'n05I', // [Dwarven Mine] - Mortar Dwarves
        'h020', // [Summons] - Water Elemental
        'h04H', // [Draenei] - Salamander Hatchling
        'h03U', // [Demon] - Felhound
        'oC56', // [Undead] - Meat Wagon
        'oC58', // [Orc Stronghold] - Barrelmaster
        'h01E', // [Gnolls] - Gnoll Warden
        'n056', // [Caerbannog] - Cow Catapult (Sheep)
        'n00M', // [Corrupt N.Elves] - Den
        'n05J', // [Dwarven Mine] - Dwarven Hunter
        'n03E', // [Forest Trolls] - Forest Troll Beserker
        'n02B', // [Gnolls] - Gnoll Brute
        'n05K', // [Dwarven Mine] - Mountain Dwarf
        'n01T', // [Critters] - Stag
        'h04F', // [Draenei] - Draenei Seer
        'hC53', // [Giants] - Rock Giant
        'hC36', // [Aviaries] - Gyrocopter
        'o005', // [Outland] - Chaos Warlock
        'o00B', // [High Elven] - Elven Sorceress
        'oC73', // [Undead] - Obsidian Statue
        'n02H', // [Corrupt N.Elves] - Roots
        'n03F', // [Forest Trolls] - Forest Troll Trapper
        'n02C', // [Gnolls] - Gnoll Elite
        'n057', // [Caerbannog] - Witch Hunter (Peasant)
        'h02A', // [Uniques] - Orc Firebat
        'h022', // [Summons] - Spirit Bear
        'h01D', // [Tavern] - Forest Troll Shadow Priest
        'n00L', // [Corrupt N.Elves] - Corrupted Ancient Protector
        'n05L', // [Dwarven Mine] - Blacksmith
        'n03G', // [Forest Trolls] - Forest Troll Warlord
        'n01U', // [Critters] - Frog
        'n058', // [Caerbannog] - The Knights Who Say Ni!
        'h005', // [Aviaries] - Gryphon Rider
        'h025', // [Summons] - Serpent Ward
        'hC54', // [Humans] - Siege Engine
        'h03X', // [Demon] - Succubus
        'h00Q', // Batrider
        'h00M', // [Aviaries] - Harpy
        'hC94', // [Undead] - Lich
        'o00R', // [Undead] - Boneyard
        'o007', // [Outland] - Fel Champion
        'o012', // [Shrine of Buffs] - Chaos Shrine
        'oC26', // [Giants] - Iron Golem Statue
        'o00X', // [Giants] - Ancient Golem
        'oC64', // [Orc Stronghold] - Tauren
        'hC34', // [Tavern] - Harpy Scout
        'n05M', // [Dwarven Mine] - Dwarven Warrior
        'n03H', // [Forest Trolls] - Forest Troll Shadow Priest
        'n059', // [Caerbannog] - Tim the Enchanter
        'h02J', // [Uniques] - Admiral Proudmoore
        'h026', // [Summons] - Lava Spawn
        'h02R', // [Draenei] - Draenei Demolisher
        'hC02', // [Orc Stronghold] - Grunt
        'hC11', // [Aviaries] - Hippogryph
        'h006', // [Humans] - Phoenix Egg
        'e00K', // [Galaxy] - Moon Dancer
        'e00L', // [Galaxy] - Druid
        'e00O', // [Galaxy] - Night Star
        'e00J', // [Galaxy] - Star Shooter
        'n010', // [Corrupt N.Elves] - Corrupted Ancient of Lore
        'n00U', // [Demon] - Summoning Shrine
        'h04K', // [Arachnid] - Basement Barrel
        'h02G', // [Void Cult] - Void Worshipper
        'h02F', // [Void Cult] - Void Priest
        'h03E', // [Workers Union] - Orc Peon
        'h03I', // [Workers Union] - Undead Acolyte
        'h03F', // [Workers Union] - Human Peasant
        'e00E', // [Night Elves] - Wisp
        'hC80', // [Night Elves] - Huntress
        'hC82', // [Night Elves] - Ancient Protector
        'hC86', // [Night Elves] - Chimaera Roost
        'h04T', // [Cavernous Creatures] - Cavern Mushroom
        'h04R', // [Cavernous Creatures] - Small Cavernous Growth
        'h041', // [Cavernous Creatures] - Cavern Frog
        'h04M', // [Cavernous Creatures] - Cavern Hermit
        'o00C', // [High Elven] - High Elf Captain
        'n00F', // [Ice Trolls] - Ice Troll
        'n00G', // [Ice Trolls] - Ice Troll Berserker
        'n00H', // [Ice Trolls] - Ice Troll Trapper
        'n018', // [Ice Trolls] - Ice Troll Priest
        'u010', // [Forsaken] - Banshee
        'u011', // [Forsaken] - Destroyer
        'u012', // [Forsaken] - Varimathras
        'u013', // [Forsaken] - Sylvanas Windrunner
        'u01C', // [Outland] - Magtheridon
        'o01O', // [Goblins] - Alchemist
        'o01P', // [Goblins] - Goblin Blademaster
        'o01S', // [Goblins] - Tinker
        'h03V', // [Demon] - Doom Guard
        'hC97', // [Giants] - Ogre Magi
        'h00R', // [Undead] - Sacrificial Pit
        'o006', // [Shrine of Buffs] - Chaos Kodo Beast
        'oC67', // [Giants] - Ogre Lord
        'oC60', // [Aviaries] - Wyvern
        'h01G', // [Tavern] - Razormane
        'n00N', // [Corrupt N.Elves] - Corrupted Ancient of War
        'n05B', // [Caerbannog] - Brother Maynard
        'n03I', // [Forest Trolls] - Forest Troll High Priest
        'n02D', // [Gnolls] - Gnoll Poacher
        'n05A', // [Caerbannog] - Killer Rabbit
        'n01W', // [Critters] - Penguin
        'h02K', // [Uniques] - Butthole Monstrosity
        'h02L', // [Uniques] - Hydralisk
        'h027', // [Summons] - Prawn
        'h04B', // [Humans] - Cold Tower
        'o013', // [Shrine of Buffs] - Chaos Pool
        'oC68', // [Aviaries] - Chimera
        'o00D', // [High Elven] - Sylvanus Windrunner
        'o00Q', // [High Elven] - Spellbreaker
        'o00S', // [Orc Stronghold] - Tauren Chieftain
        'n00P', // [Corrupt N.Elves] - Corrupted Tree of Life
        'n05N', // [Dwarven Mine] - Flying Dwarf
        'n03J', // [Forest Trolls] - Forest Troll Joker
        'n01Z', // [Critters] - Pig
        'h04G', // [Draenei] - Draenei Spiritualist
        'h00K', // [Humans] - Death Tower
        'h00F', // [Demon] - Demonized Dreadlord
        'h00N', // [Undead] - Infernal Fireblaster
        'o016', // [Outland] - Black Citadel WarMachine
        'oC74', // [Undead] - Dune Worm
        'o015', // [Giants] - Giant Revenant
        'o008', // [Shrine of Buffs] - Grom Hellscream
        'o00G', // [Giants] - Flesh Golem
        'o00U', // [Aviaries] - Phoenix
        'o00P', // [Orc Stronghold] - Rexxar
        'o00Y', // [Giants] - Sea Giant
        'h04I', // [Draenei] - Salamander Lord
        'n05O', // [Dwarven Mine] - Battle Golem
        'n02E', // [Gnolls] - Gnoll Assassin
        'n01X', // [Critters] - Lizard
        'n05C', // [Caerbannog] - Sir Galahad the Pure
        'n020', // [Critters] - Snow Owl
        'h028', // [Summons] - Skeletal Mage
        'h029', // [Summons] - Spirit Hawk
        'h04C', // [Humans] - Boulder Tower
        'h002', // [Orc Stronghold] - Rokhan
        'o01B', // [Outland] - Rend Blackhand
        'o00N', // [High Elven] - Kael
        'oC65', // [Orc Stronghold] - Warchief Thrall
        'h01U', // [Tavern] - Fire Lord
        'n03L', // [Forest Trolls] - Forest Troll King
        'n02F', // [Gnolls] - Gnoll Warden
        'n05D', // [Caerbannog] - Shrubbery
        'n03B', // [Cavernous Creatures] - Spirit Hydra
        'n021', // [Critters] - Black Sheep
        'h02B', // [Summons] - Treant
        'h04D', // [Humans] - Flame Tower
        'h00L', // [Humans] - Dalaran Guard Tower
        'h000', // [Undead] - Antonidas the Undead
        'o00L', // [Demon] - Mannoroth
        'eC93', // [Demon] - Kil'jaeden
        'n00R', // [Corrupt N.Elves] - Corrupted Shandris
        'n00S', // [Corrupt N.Elves] - Corrupted Warden
        'n05Q', // [Dwarven Mine] - Dwarf King (Statue)
        'n03K', // [Forest Trolls] - Forest Troll Emperor
        'n05F', // [Caerbannog] - Sir Lancelot the Brave
        'n02R', // Dragon Turtle
        'n05E', // [Caerbannog] - The Black Beast of Arrrghhh
        'n02G', // [Gnolls] - Gnoll Leader
        'h02Q', // [Uniques] - Iron Arthas
        'h02D', // [Summons] - Avatar of Vengeance
        'h02C', // [Summons] - Quilbeast
        'h00I', // [Draenei] - Akama
        'h02V', // [Humans] - Earth-Fury
        'e00P', // [Galaxy] - Star Chaser
        'e00Q', // [Galaxy] - Space Runner
        'e00R', // [Galaxy] - Celestial Mist
        'e00S', // [Galaxy] - Moonlight
        'e00T', // [Galaxy] - The Creator
        'o001', // [Giants] - Giant King

        // Seems limit is 204 building, leaving this here for now
        // 'o00Z', // [High Elven] - Ballista
        // 'h01M', // [Void Cult] - Void Fissure
        // 'h01A', // [Void Cult] - Void Corrupter
        // 'h03G', // [Workers Union] - Naga Slave
        // 'h03H', // [Workers Union] - Night Elf Wisp
        // 'h00B', // [Night Elves] - Ancient of Wind
        // 'h00G', // [Night Elves] - Warden
        // 'e008', // [Night Elves] - Illidan
        // 'h04N', // [Cavernous Creatures] - Cavern Turtle
        // 'h04Q', // [Cavernous Creatures] - Cavern Druid
        // 'h04O', // [Cavernous Creatures] - Cavern Revenant
        // 'n019', // [Ice Trolls] - Ice Troll High Priest
        // 'n01A', // [Ice Trolls] - Ice Troll Joker
        // 'n01B', // [Ice Trolls] - Ice Troll King
        // 'n01C', // [Ice Trolls] - Ice Troll Emperor
        // 'o00V', // [Outland] - Chaos Raider
    ];
    const unit = objectData.units.get('e00I'); // WEEIZ

    if (!unit) {
        return;
    }

    unit.structuresBuilt = TEMP_HYBRID_RANDOM_ARR.join(',');

    objectData.save();

    const weeiz: string[] = ['e00I'];
    const numbers: string[] = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tier_limits: number[] = [15, 99, 149, 299, 399, 499, 699, 899, 0];
    const tier_towers: string[][] = [];


    const goldCosts: Record<string, number> = {};
    TEMP_HYBRID_RANDOM_ARR.forEach(towerKey => {
        const unit = objectData.units.get(towerKey)
        if (unit?.goldCostundefined) {
            goldCosts[towerKey] = unit.goldCostundefined;
        }
    });

    TEMP_HYBRID_RANDOM_ARR.forEach(towerKey => {
        for (let i = 0; i < tier_limits.length; i++) {
            if (goldCosts[towerKey] <= tier_limits[i] || i === tier_limits.length - 1) {
                if (!tier_towers[i]) {
                    tier_towers[i] = [];
                }
                tier_towers[i].push(towerKey);
                break;
            }
        }
    });

    const returnTiers: Record<string, HybridTower[]> = {
        HybridTierOne: [],
        HybridTierTwo: [],
        HybridTierThree: [],
        HybridTierFour: [],
        HybridTierFive: [],
        HybridTierSix: [],
        HybridTierSeven: [],
        HybridTierEight: [],
        HybridTierNine: [],
    }

    for (let tier = 0; tier < tier_limits.length; tier++) {
        const tierString = numbers[tier];
        // generatedHybridList.push(`export const HybridTier${tierString}: HybridTower[] = [`);

        tier_towers[tier].forEach(towerKey => {
            const unit = objectData.units.get(towerKey)

            returnTiers[`HybridTier${tierString}` as keyof typeof returnTiers].push({
                name: unit?.name || 'UNKNOWN NAME',
                id: towerKey
            })
            // const unitId = towerKey.split(":")[0];
            // const unitNameProp = jsonData.custom[towerKey].find((property: any) => property.id === 'unam');
            // if (unitNameProp) {
            //     const unitName = unitNameProp.value;
            //     generatedHybridList.push(`    { id: '${unitId}', name: \`${unitName}\` }, // ${unitName}`);
            // }
        });
        // generatedHybridList.push("];");
    }

    return returnTiers;
}) as {
    HybridTierOne: HybridTower[],
    HybridTierTwo: HybridTower[],
    HybridTierThree: HybridTower[],
    HybridTierFour: HybridTower[],
    HybridTierFive: HybridTower[],
    HybridTierSix: HybridTower[],
    HybridTierSeven: HybridTower[],
    HybridTierEight: HybridTower[],
    HybridTierNine: HybridTower[],
};


export const Hybrid: HybridTower[] = [
    {id: 'e00E', name: `[Night Elves] - Wisp`}, // [Night Elves] - Wisp
    {id: 'e00J', name: `[Galaxy] - Star Shooter`}, // [Galaxy] - Star Shooter
    {id: 'h00Z', name: `[Dragons] - Dragonkin`}, // [Dragons] - Dragonkin
    {id: 'h011', name: `[Goblins] - Pocket Factory`}, // [Goblins] - Pocket Factory
    {id: 'h01C', name: `[Tavern] - Centaur Outrunner`}, // [Tavern] - Centaur Outrunner
    {id: 'h01Z', name: `[Summons] - Spirit Wolf`}, // [Summons] - Spirit Wolf
    {id: 'h02G', name: `[Void Cult] - Void Worshipper`}, // [Void Cult] - Void Worshipper
    {id: 'h02H', name: `[Uniques] - Marine`}, // [Uniques] - Marine
    {id: 'h03D', name: `[Draenei] - Draenei Hut`}, // [Draenei] - Draenei Hut
    {id: 'h03E', name: `[Workers Union] - Orc Peon`}, // [Workers Union] - Orc Peon
    {id: 'h03W', name: `[Demon] - Felguard`}, // [Demon] - Felguard
    {id: 'h04K', name: `[Arachnid] - Basement Barrel`}, // [Arachnid] - Basement Barrel
    {id: 'h04T', name: `[Cavernous Creatures] - Cavern Mushroom`}, // [Cavernous Creatures] - Cavern Mushroom
    {id: 'hC02', name: `[Orc Stronghold] - Grunt`}, // [Orc Stronghold] - Grunt
    {id: 'hC11', name: `[Aviaries] - Hippogryph`}, // [Aviaries] - Hippogryph
    {id: 'hC21', name: `[Undead] - Ghast`}, // [Undead] - Ghast
    {id: 'hC66', name: `[Humans] - Tower`}, // [Humans] - Tower
    {id: 'n009', name: `[Corrupt N.Elves] - Corrupted Moon Well`}, // [Corrupt N.Elves] - Corrupted Moon Well
    {id: 'n00F', name: `[Ice Trolls] - Ice Troll`}, // [Ice Trolls] - Ice Troll
    {id: 'n01Y', name: `[Critters] - Mazing Tower`}, // [Critters] - Mazing Tower
    {id: 'n029', name: `[Gnolls] - Gnoll`}, // [Gnolls] - Gnoll
    {id: 'n02H', name: `[Corrupt N.Elves] - Roots`}, // [Corrupt N.Elves] - Roots
    {id: 'n03D', name: `[Forest Trolls] - Forest Troll`}, // [Forest Trolls] - Forest Troll
    {id: 'n055', name: `[Caerbannog] - French Soldier`}, // [Caerbannog] - French Soldier
    {id: 'n05H', name: `[Dwarves] - Undead Dwarf`}, // [Dwarves] - Undead Dwarf
    {id: 'o003', name: `[Outland] - Chaos Grunt`}, // [Outland] - Chaos Grunt
    {id: 'o009', name: `[High Elven] - Elven Swordsman`}, // [High Elven] - Elven Swordsman
    {id: 'oC14', name: `[Giants] - Sasquatch`}, // [Giants] - Sasquatch
    {id: 'u00C', name: `[Forsaken] - Tombstone`}, // [Forsaken] - Tombstone
    {id: 'e00K', name: `[Galaxy] - Moon Dancer`}, // [Galaxy] - Moon Dancer
    {id: 'h010', name: `[Dragons] - Dragon Egg`}, // [Dragons] - Dragon Egg
    {id: 'h01E', name: `[Gnolls] - Gnoll Warden`}, // [Gnolls] - Gnoll Warden
    {id: 'h020', name: `[Summons] - Water Elemental`}, // [Summons] - Water Elemental
    {id: 'h03I', name: `[Workers Union] - Undead Acolyte`}, // [Workers Union] - Undead Acolyte
    {id: 'h03U', name: `[Demon] - Felhound`}, // [Demon] - Felhound
    {id: 'h041', name: `[Cavernous Creatures] - Cavern Frog`}, // [Cavernous Creatures] - Cavern Frog
    {id: 'h04H', name: `[Draenei] - Salamander Hatchling`}, // [Draenei] - Salamander Hatchling
    {id: 'h04R', name: `[Cavernous Creatures] - Small Cavernous Growth`}, // [Cavernous Creatures] - Small Cavernous Growth
    {id: 'hC27', name: `[Undead] - Crypt Fiend`}, // [Undead] - Crypt Fiend
    {id: 'hC80', name: `[Night Elves] - Huntress`}, // [Night Elves] - Huntress
    {id: 'n00G', name: `[Ice Trolls] - Ice Troll Berserker`}, // [Ice Trolls] - Ice Troll Berserker
    {id: 'n00M', name: `[Corrupt N.Elves] - Den`}, // [Corrupt N.Elves] - Den
    {id: 'n00O', name: `[Corrupt N.Elves] - Corrupted Ent`}, // [Corrupt N.Elves] - Corrupted Ent
    {id: 'n010', name: `[Corrupt N.Elves] - Corrupted Ancient of Lore`}, // [Corrupt N.Elves] - Corrupted Ancient of Lore
    {id: 'n01T', name: `[Critters] - Stag`}, // [Critters] - Stag
    {id: 'n02B', name: `[Gnolls] - Gnoll Brute`}, // [Gnolls] - Gnoll Brute
    {id: 'n03E', name: `[Forest Trolls] - Forest Troll Beserker`}, // [Forest Trolls] - Forest Troll Beserker
    {id: 'n056', name: `[Caerbannog] - Cow Catapult (Sheep)`}, // [Caerbannog] - Cow Catapult (Sheep)
    {id: 'n05I', name: `[Dwarven Mine] - Mortar Dwarves`}, // [Dwarven Mine] - Mortar Dwarves
    {id: 'n05J', name: `[Dwarven Mine] - Dwarven Hunter`}, // [Dwarven Mine] - Dwarven Hunter
    {id: 'n05K', name: `[Dwarven Mine] - Mountain Dwarf`}, // [Dwarven Mine] - Mountain Dwarf
    {id: 'o004', name: `[Outland] - Nether Drake Hatchling`}, // [Outland] - Nether Drake Hatchling
    {id: 'o00A', name: `[High Elven] - High Elf Archer`}, // [High Elven] - High Elf Archer
    {id: 'o01M', name: `[Goblins] - Sappers`}, // [Goblins] - Sappers
    {id: 'oC18', name: `[Aviaries] - Gargoyle`}, // [Aviaries] - Gargoyle
    {id: 'oC19', name: `[Orc Stronghold] - Headhunter`}, // [Orc Stronghold] - Headhunter
    {id: 'oC35', name: `[Giants] - Ogre Warrior`}, // [Giants] - Ogre Warrior
    {id: 'oC56', name: `[Undead] - Meat Wagon`}, // [Undead] - Meat Wagon
    {id: 'u00D', name: `[Forsaken] - Necromancer`}, // [Forsaken] - Necromancer
    {id: 'e00L', name: `[Galaxy] - Druid`}, // [Galaxy] - Druid
    {id: 'h022', name: `[Summons] - Spirit Bear`}, // [Summons] - Spirit Bear
    {id: 'h02A', name: `[Uniques] - Orc Firebat`}, // [Uniques] - Orc Firebat
    {id: 'h04F', name: `[Draenei] - Draenei Seer`}, // [Draenei] - Draenei Seer
    {id: 'hC08', name: `[Humans] - Knight`}, // [Humans] - Knight
    {id: 'hC36', name: `[Aviaries] - Gyrocopter`}, // [Aviaries] - Gyrocopter
    {id: 'hC53', name: `[Giants] - Rock Giant`}, // [Giants] - Rock Giant
    {id: 'n00H', name: `[Ice Trolls] - Ice Troll Trapper`}, // [Ice Trolls] - Ice Troll Trapper
    {id: 'n01U', name: `[Critters] - Frog`}, // [Critters] - Frog
    {id: 'n02C', name: `[Gnolls] - Gnoll Elite`}, // [Gnolls] - Gnoll Elite
    {id: 'n03F', name: `[Forest Trolls] - Forest Troll Trapper`}, // [Forest Trolls] - Forest Troll Trapper
    {id: 'n057', name: `[Caerbannog] - Witch Hunter (Peasant)`}, // [Caerbannog] - Witch Hunter (Peasant)
    {id: 'o005', name: `[Outland] - Chaos Warlock`}, // [Outland] - Chaos Warlock
    {id: 'o00V', name: `[Outland] - Chaos Raider`}, // [Outland] - Chaos Raider
    {id: 'oC73', name: `[Undead] - Obsidian Statue`}, // [Undead] - Obsidian Statue
    {id: 'u00E', name: `[Forsaken] - Abomination`}, // [Forsaken] - Abomination
    {id: 'e00O', name: `[Galaxy] - Night Star`}, // [Galaxy] - Night Star
    {id: 'h005', name: `[Aviaries] - Gryphon Rider`}, // [Aviaries] - Gryphon Rider
    {id: 'h006', name: `[Humans] - Phoenix Egg`}, // [Humans] - Phoenix Egg
    {id: 'h00M', name: `[Aviaries] - Harpy`}, // [Aviaries] - Harpy
    {id: 'h00Q', name: `Batrider`}, // Batrider
    {id: 'h01D', name: `[Tavern] - Forest Troll Shadow Priest`}, // [Tavern] - Forest Troll Shadow Priest
    {id: 'h025', name: `[Summons] - Serpent Ward`}, // [Summons] - Serpent Ward
    {id: 'h026', name: `[Summons] - Lava Spawn`}, // [Summons] - Lava Spawn
    {id: 'h02F', name: `[Void Cult] - Void Priest`}, // [Void Cult] - Void Priest
    {id: 'h02J', name: `[Uniques] - Admiral Proudmoore`}, // [Uniques] - Admiral Proudmoore
    {id: 'h02R', name: `[Draenei] - Draenei Demolisher`}, // [Draenei] - Draenei Demolisher
    {id: 'h03F', name: `[Workers Union] - Human Peasant`}, // [Workers Union] - Human Peasant
    {id: 'h03X', name: `[Demon] - Succubus`}, // [Demon] - Succubus
    {id: 'h04M', name: `[Cavernous Creatures] - Cavern Hermit`}, // [Cavernous Creatures] - Cavern Hermit
    {id: 'hC34', name: `[Tavern] - Harpy Scout`}, // [Tavern] - Harpy Scout
    {id: 'hC54', name: `[Humans] - Siege Engine`}, // [Humans] - Siege Engine
    {id: 'hC82', name: `[Night Elves] - Ancient Protector`}, // [Night Elves] - Ancient Protector
    {id: 'hC86', name: `[Night Elves] - Chimaera Roost`}, // [Night Elves] - Chimaera Roost
    {id: 'hC94', name: `[Undead] - Lich`}, // [Undead] - Lich
    {id: 'n00L', name: `[Corrupt N.Elves] - Corrupted Ancient Protector`}, // [Corrupt N.Elves] - Corrupted Ancient Protector
    {id: 'n00U', name: `[Demon] - Summoning Shrine`}, // [Demon] - Summoning Shrine
    {id: 'n018', name: `[Ice Trolls] - Ice Troll Priest`}, // [Ice Trolls] - Ice Troll Priest
    {id: 'n01W', name: `[Critters] - Penguin`}, // [Critters] - Penguin
    {id: 'n03G', name: `[Forest Trolls] - Forest Troll Warlord`}, // [Forest Trolls] - Forest Troll Warlord
    {id: 'n03H', name: `[Forest Trolls] - Forest Troll Shadow Priest`}, // [Forest Trolls] - Forest Troll Shadow Priest
    {id: 'n058', name: `[Caerbannog] - The Knights Who Say Ni!`}, // [Caerbannog] - The Knights Who Say Ni!
    {id: 'n059', name: `[Caerbannog] - Tim the Enchanter`}, // [Caerbannog] - Tim the Enchanter
    {id: 'n05L', name: `[Dwarven Mine] - Blacksmith`}, // [Dwarven Mine] - Blacksmith
    {id: 'n05M', name: `[Dwarven Mine] - Dwarven Warrior`}, // [Dwarven Mine] - Dwarven Warrior
    {id: 'o007', name: `[Outland] - Fel Champion`}, // [Outland] - Fel Champion
    {id: 'o00B', name: `[High Elven] - Elven Sorceress`}, // [High Elven] - Elven Sorceress
    {id: 'o00C', name: `[High Elven] - High Elf Captain`}, // [High Elven] - High Elf Captain
    {id: 'o00R', name: `[Undead] - Boneyard`}, // [Undead] - Boneyard
    {id: 'o00X', name: `[Giants] - Ancient Golem`}, // [Giants] - Ancient Golem
    {id: 'o012', name: `[Shrine of Buffs] - Chaos Shrine`}, // [Shrine of Buffs] - Chaos Shrine
    {id: 'o01N', name: `[Goblins] - Shredder`}, // [Goblins] - Shredder
    {id: 'o01R', name: `[Goblins] - Goblin Minelayer`}, // [Goblins] - Goblin Minelayer
    {id: 'oC26', name: `[Giants] - Iron Golem Statue`}, // [Giants] - Iron Golem Statue
    {id: 'oC58', name: `[Orc Stronghold] - Barrelmaster`}, // [Orc Stronghold] - Barrelmaster
    {id: 'oC64', name: `[Orc Stronghold] - Tauren`}, // [Orc Stronghold] - Tauren
    {id: 'u00F', name: `[Forsaken] - Gargoyle Spire`}, // [Forsaken] - Gargoyle Spire
    {id: 'e00P', name: `[Galaxy] - Star Chaser`}, // [Galaxy] - Star Chaser
    {id: 'h00R', name: `[Undead] - Sacrificial Pit`}, // [Undead] - Sacrificial Pit
    {id: 'h01G', name: `[Tavern] - Razormane`}, // [Tavern] - Razormane
    {id: 'h027', name: `[Summons] - Prawn`}, // [Summons] - Prawn
    {id: 'h03V', name: `[Demon] - Doom Guard`}, // [Demon] - Doom Guard
    {id: 'h04B', name: `[Humans] - Cold Tower`}, // [Humans] - Cold Tower
    {id: 'h04G', name: `[Draenei] - Draenei Spiritualist`}, // [Draenei] - Draenei Spiritualist
    {id: 'h04N', name: `[Cavernous Creatures] - Cavern Turtle`}, // [Cavernous Creatures] - Cavern Turtle
    {id: 'hC97', name: `[Giants] - Ogre Magi`}, // [Giants] - Ogre Magi
    {id: 'n00N', name: `[Corrupt N.Elves] - Corrupted Ancient of War`}, // [Corrupt N.Elves] - Corrupted Ancient of War
    {id: 'n019', name: `[Ice Trolls] - Ice Troll High Priest`}, // [Ice Trolls] - Ice Troll High Priest
    {id: 'n02D', name: `[Gnolls] - Gnoll Poacher`}, // [Gnolls] - Gnoll Poacher
    {id: 'n03I', name: `[Forest Trolls] - Forest Troll High Priest`}, // [Forest Trolls] - Forest Troll High Priest
    {id: 'n05A', name: `[Caerbannog] - Killer Rabbit`}, // [Caerbannog] - Killer Rabbit
    {id: 'n05B', name: `[Caerbannog] - Brother Maynard`}, // [Caerbannog] - Brother Maynard
    {id: 'o006', name: `[Shrine of Buffs] - Chaos Kodo Beast`}, // [Shrine of Buffs] - Chaos Kodo Beast
    {id: 'o00S', name: `[Orc Stronghold] - Tauren Chieftain`}, // [Orc Stronghold] - Tauren Chieftain
    {id: 'o00Z', name: `[High Elven] - Ballista`}, // [High Elven] - Ballista
    {id: 'oC60', name: `[Aviaries] - Wyvern`}, // [Aviaries] - Wyvern
    {id: 'oC67', name: `[Giants] - Ogre Lord`}, // [Giants] - Ogre Lord
    {id: 'u010', name: `[Forsaken] - Banshee`}, // [Forsaken] - Banshee
    {id: 'e00Q', name: `[Galaxy] - Space Runner`}, // [Galaxy] - Space Runner
    {id: 'h00B', name: `[Night Elves] - Ancient of Wind`}, // [Night Elves] - Ancient of Wind
    {id: 'h00K', name: `[Humans] - Death Tower`}, // [Humans] - Death Tower
    {id: 'h028', name: `[Summons] - Skeletal Mage`}, // [Summons] - Skeletal Mage
    {id: 'h02K', name: `[Uniques] - Butthole Monstrosity`}, // [Uniques] - Butthole Monstrosity
    {id: 'h03G', name: `[Workers Union] - Naga Slave`}, // [Workers Union] - Naga Slave
    {id: 'h04Q', name: `[Cavernous Creatures] - Cavern Druid`}, // [Cavernous Creatures] - Cavern Druid
    {id: 'n00P', name: `[Corrupt N.Elves] - Corrupted Tree of Life`}, // [Corrupt N.Elves] - Corrupted Tree of Life
    {id: 'n01A', name: `[Ice Trolls] - Ice Troll Joker`}, // [Ice Trolls] - Ice Troll Joker
    {id: 'n01Z', name: `[Critters] - Pig`}, // [Critters] - Pig
    {id: 'n03J', name: `[Forest Trolls] - Forest Troll Joker`}, // [Forest Trolls] - Forest Troll Joker
    {id: 'n05N', name: `[Dwarven Mine] - Flying Dwarf`}, // [Dwarven Mine] - Flying Dwarf
    {id: 'o00Q', name: `[High Elven] - Spellbreaker`}, // [High Elven] - Spellbreaker
    {id: 'o013', name: `[Shrine of Buffs] - Chaos Pool`}, // [Shrine of Buffs] - Chaos Pool
    {id: 'o01O', name: `[Goblins] - Alchemist`}, // [Goblins] - Alchemist
    {id: 'oC68', name: `[Aviaries] - Chimera`}, // [Aviaries] - Chimera
    {id: 'e00R', name: `[Galaxy] - Celestial Mist`}, // [Galaxy] - Celestial Mist
    {id: 'h00F', name: `[Demon] - Demonized Dreadlord`}, // [Demon] - Demonized Dreadlord
    {id: 'h00G', name: `[Night Elves] - Warden`}, // [Night Elves] - Warden
    {id: 'h00N', name: `[Undead] - Infernal Fireblaster`}, // [Undead] - Infernal Fireblaster
    {id: 'h01M', name: `[Void Cult] - Void Fissure`}, // [Void Cult] - Void Fissure
    {id: 'h029', name: `[Summons] - Spirit Hawk`}, // [Summons] - Spirit Hawk
    {id: 'h02L', name: `[Uniques] - Hydralisk`}, // [Uniques] - Hydralisk
    {id: 'h03H', name: `[Workers Union] - Night Elf Wisp`}, // [Workers Union] - Night Elf Wisp
    {id: 'h04C', name: `[Humans] - Boulder Tower`}, // [Humans] - Boulder Tower
    {id: 'h04I', name: `[Draenei] - Salamander Lord`}, // [Draenei] - Salamander Lord
    {id: 'h04O', name: `[Cavernous Creatures] - Cavern Revenant`}, // [Cavernous Creatures] - Cavern Revenant
    {id: 'n00S', name: `[Corrupt N.Elves] - Corrupted Warden`}, // [Corrupt N.Elves] - Corrupted Warden
    {id: 'n01B', name: `[Ice Trolls] - Ice Troll King`}, // [Ice Trolls] - Ice Troll King
    {id: 'n01X', name: `[Critters] - Lizard`}, // [Critters] - Lizard
    {id: 'n02E', name: `[Gnolls] - Gnoll Assassin`}, // [Gnolls] - Gnoll Assassin
    {id: 'n05C', name: `[Caerbannog] - Sir Galahad the Pure`}, // [Caerbannog] - Sir Galahad the Pure
    {id: 'n05O', name: `[Dwarven Mine] - Battle Golem`}, // [Dwarven Mine] - Battle Golem
    {id: 'o008', name: `[Shrine of Buffs] - Grom Hellscream`}, // [Shrine of Buffs] - Grom Hellscream
    {id: 'o00D', name: `[High Elven] - Sylvanus Windrunner`}, // [High Elven] - Sylvanus Windrunner
    {id: 'o00G', name: `[Giants] - Flesh Golem`}, // [Giants] - Flesh Golem
    {id: 'o00P', name: `[Orc Stronghold] - Rexxar`}, // [Orc Stronghold] - Rexxar
    {id: 'o00U', name: `[Aviaries] - Phoenix`}, // [Aviaries] - Phoenix
    {id: 'o00Y', name: `[Giants] - Sea Giant`}, // [Giants] - Sea Giant
    {id: 'o015', name: `[Giants] - Giant Revenant`}, // [Giants] - Giant Revenant
    {id: 'o016', name: `[Outland] - Black Citadel WarMachine`}, // [Outland] - Black Citadel WarMachine
    {id: 'o01P', name: `[Goblins] - Goblin Blademaster`}, // [Goblins] - Goblin Blademaster
    {id: 'oC74', name: `[Undead] - Dune Worm`}, // [Undead] - Dune Worm
    {id: 'u011', name: `[Forsaken] - Destroyer`}, // [Forsaken] - Destroyer
    {id: 'e008', name: `[Night Elves] - Illidan`}, // [Night Elves] - Illidan
    {id: 'e00S', name: `[Galaxy] - Moonlight`}, // [Galaxy] - Moonlight
    {id: 'h002', name: `[Orc Stronghold] - Rokhan`}, // [Orc Stronghold] - Rokhan
    {id: 'h00I', name: `[Draenei] - Akama`}, // [Draenei] - Akama
    {id: 'h00L', name: `[Humans] - Dalaran Guard Tower`}, // [Humans] - Dalaran Guard Tower
    {id: 'h01A', name: `[Void Cult] - Void Corrupter`}, // [Void Cult] - Void Corrupter
    {id: 'h01U', name: `[Tavern] - Fire Lord`}, // [Tavern] - Fire Lord
    {id: 'h02B', name: `[Summons] - Treant`}, // [Summons] - Treant
    {id: 'h02C', name: `[Summons] - Quilbeast`}, // [Summons] - Quilbeast
    {id: 'h02Q', name: `[Uniques] - Iron Arthas`}, // [Uniques] - Iron Arthas
    {id: 'h04D', name: `[Humans] - Flame Tower`}, // [Humans] - Flame Tower
    {id: 'n020', name: `[Critters] - Snow Owl`}, // [Critters] - Snow Owl
    {id: 'n02F', name: `[Gnolls] - Gnoll Warden`}, // [Gnolls] - Gnoll Warden
    {id: 'n03L', name: `[Forest Trolls] - Forest Troll King`}, // [Forest Trolls] - Forest Troll King
    {id: 'n05D', name: `[Caerbannog] - Shrubbery`}, // [Caerbannog] - Shrubbery
    {id: 'o00L', name: `[Demon] - Mannoroth`}, // [Demon] - Mannoroth
    {id: 'o00N', name: `[High Elven] - Kael`}, // [High Elven] - Kael
    {id: 'o01B', name: `[Outland] - Rend Blackhand`}, // [Outland] - Rend Blackhand
    {id: 'u012', name: `[Forsaken] - Varimathras`}, // [Forsaken] - Varimathras
    {id: 'e00T', name: `[Galaxy] - The Creator`}, // [Galaxy] - The Creator
    {id: 'eC93', name: `[Demon] - Kil'jaeden`}, // [Demon] - Kil'jaeden
    {id: 'h000', name: `[Undead] - Antonidas the Undead`}, // [Undead] - Antonidas the Undead
    {id: 'h02D', name: `[Summons] - Avatar of Vengeance`}, // [Summons] - Avatar of Vengeance
    {id: 'h02V', name: `[Humans] - Earth-Fury`}, // [Humans] - Earth-Fury
    {id: 'n00R', name: `[Corrupt N.Elves] - Corrupted Shandris`}, // [Corrupt N.Elves] - Corrupted Shandris
    {id: 'n01C', name: `[Ice Trolls] - Ice Troll Emperor`}, // [Ice Trolls] - Ice Troll Emperor
    {id: 'n021', name: `[Critters] - Black Sheep`}, // [Critters] - Black Sheep
    {id: 'n02G', name: `[Gnolls] - Gnoll Leader`}, // [Gnolls] - Gnoll Leader
    {id: 'n02R', name: `Dragon Turtle`}, // Dragon Turtle
    {id: 'n03B', name: `[Cavernous Creatures] - Spirit Hydra`}, // [Cavernous Creatures] - Spirit Hydra
    {id: 'n03K', name: `[Forest Trolls] - Forest Troll Emperor`}, // [Forest Trolls] - Forest Troll Emperor
    {id: 'n05E', name: `[Caerbannog] - The Black Beast of Arrrghhh`}, // [Caerbannog] - The Black Beast of Arrrghhh
    {id: 'n05F', name: `[Caerbannog] - Sir Lancelot the Brave`}, // [Caerbannog] - Sir Lancelot the Brave
    {id: 'n05Q', name: `[Dwarven Mine] - Dwarf King (Statue)`}, // [Dwarven Mine] - Dwarf King (Statue)
    {id: 'o001', name: `[Giants] - Giant King`}, // [Giants] - Giant King
    {id: 'o01S', name: `[Goblins] - Tinker`}, // [Goblins] - Tinker
    {id: 'oC65', name: `[Orc Stronghold] - Warchief Thrall`}, // [Orc Stronghold] - Warchief Thrall
    {id: 'u013', name: `[Forsaken] - Sylvanas Windrunner`}, // [Forsaken] - Sylvanas Windrunner
    {id: 'u01C', name: `[Outland] - Magtheridon`}, // [Outland] - Magtheridon
];
