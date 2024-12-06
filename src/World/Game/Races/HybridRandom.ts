import {HybridTower} from "./HybridRandom.types";
import {AbilityTypes, Unit} from "war3-objectdata-th";

interface DummyTowersEntry {
    playerId: number;
    tier: number;
    id: string;
}


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
    HybridTierNine,
    DummyTowers,
    DummyTowersMap
    // HybridSpells
} = compiletime(({objectData, constants}) => {
    const PLAYER_COUNT = 13;

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
        'o00Z', // [High Elven] - Ballista
        'h01M', // [Void Cult] - Void Fissure
        'h01A', // [Void Cult] - Void Corrupter
        'h03G', // [Workers Union] - Naga Slave
        'h03H', // [Workers Union] - Night Elf Wisp
        'h00B', // [Night Elves] - Ancient of Wind
        'h00G', // [Night Elves] - Warden
        'e008', // [Night Elves] - Illidan
        'h04N', // [Cavernous Creatures] - Cavern Turtle
        'h04Q', // [Cavernous Creatures] - Cavern Druid
        'h04O', // [Cavernous Creatures] - Cavern Revenant
        'n019', // [Ice Trolls] - Ice Troll High Priest
        'n01A', // [Ice Trolls] - Ice Troll Joker
        'n01B', // [Ice Trolls] - Ice Troll King
        'n01C', // [Ice Trolls] - Ice Troll Emperor
        'o00V', // [Outland] - Chaos Raider
    ];


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
        tier_towers[tier].forEach((towerKey) => {
            const unit = objectData.units.get(towerKey)

            returnTiers[`HybridTier${tierString}` as keyof typeof returnTiers].push({
                name: unit?.name || 'UNKNOWN NAME',
                id: towerKey,
                level: returnTiers[`HybridTier${tierString}` as keyof typeof returnTiers].length + 2,
                icon: unit?.iconGameInterface,
                goldCost: unit?.goldCostundefined || 5,
                toolTipExtended: unit?.tooltipExtended || '',
                toolTipBasic: unit?.tooltipBasic || unit?.name || 'UNKNOWN NAME'
            })
        });
    }
    const hotKeys = [
        'q', 'w', 'e',
        'a', 's', 'd',
        'z', 'x', 'c',
    ]
    const buttonPositions = [
        [0,0], [1,0], [2,0],
        [0,1], [1,1], [2,1],
        [0,2], [1,2], [2,2],
    ]

    // {playerId: {tier: dummyTowerId}}
    const hybridBuilding:  Record<string, Record<string, string>> = {}
    const hybridBuildingsMap: Record<string, DummyTowersEntry> = {}
    for (let playerNum = 0; playerNum < PLAYER_COUNT; playerNum++) {
        const playerTowers: Record<string, string> = {};
        for (let tier = 0; tier < tier_limits.length; tier++) {
            const building = objectData.units.copy('nntg')!;
            building.name = `Player ${playerNum +1} tier ${tier+1} tower`;
            building.tooltipBasic = `Build ${building.name}`;
            building.iconGameInterface = "ReplaceableTextures\\CommandButtons\\BTNHumanWatchTower.blp";
            building.buildTime = 1;
            building.repairGoldCost = 110
            building.modelFile = "buildings\\human\\HumanTower\\HumanTower"
            building.armorTypeundefined = "Wood"
            building.scalingValueundefined = 0.75
            building.lumberCostundefined = 0;
            building.goldCostundefined = 0;

            building.hotkey = hotKeys[tier];
            [building.buttonPositionX, building.buttonPositionY] = buttonPositions[tier]
            hybridBuildingsMap[building.newId] = {
                playerId: playerNum,
                tier: tier,
                id: building.newId
            }
            playerTowers[`${tier + 1 }`] = building.newId;
        }
        hybridBuilding[`${playerNum + 1}`] = playerTowers;
    }

    const hybridBuilder: Unit | undefined = objectData.units.get('e00I'); // WEEIZ

    if (!hybridBuilder) {
        return;
    }

    hybridBuilder.structuresBuilt = Object.keys(hybridBuildingsMap).join(',');

    objectData.save();
    return {
        DummyTowers: hybridBuilding,
        DummyTowersMap: hybridBuildingsMap,
        // HybridSpells: abilitites,
        HybridTierOne: returnTiers.HybridTierOne,
        HybridTierTwo: returnTiers.HybridTierTwo,
        HybridTierThree: returnTiers.HybridTierThree,
        HybridTierFour: returnTiers.HybridTierFour,
        HybridTierFive: returnTiers.HybridTierFive,
        HybridTierSix: returnTiers.HybridTierSix,
        HybridTierSeven: returnTiers.HybridTierSeven,
        HybridTierEight: returnTiers.HybridTierEight,
        HybridTierNine: returnTiers.HybridTierNine,
    };
}) as {
    DummyTowers: Record<string, Record<string, string>>;
    DummyTowersMap: Record<string, DummyTowersEntry>
    // HybridSpells: Record<string, AbilityTypes.BuildTinyScoutTower<any>>,
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

