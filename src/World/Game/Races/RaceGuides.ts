import { RANDOM_PICK_ITEMS } from './RaceItems';

// Colour codes as the map's tooltips use them
const GOLD = '|cffffcc00';
const RED = '|cffff0000';
const END = '|r';

/**
 * What the race picker's information pane says about a pick, by its item id: shown in place of
 * the item's tooltip from the object data, which for the races is only their tier. A pick not
 * listed here still shows that tooltip. The pane holds about 19 lines of 40 characters (the
 * Elementalists' guide, 15 lines, fits with room to spare: test_race_guides in wc3-slop-lan's
 * measure.py takes a screenshot of each); `\n` breaks a line.
 */
export const RACE_GUIDES: Record<string, string> = {
    [RANDOM_PICK_ITEMS.normal]: 'A random race, each with an equal chance.\n\n'
        + `Gives you ${GOLD}+30${END} gold the first time, ${GOLD}+20${END} the second and ${GOLD}+10${END} every time after.\n\n`
        + 'You may repick with -repick before the first wave; you keep no more than the starting gold.',

    [RANDOM_PICK_ITEMS.hardcore]: 'A random race, each with an equal chance.\n\n'
        + `Gives you ${GOLD}+50${END} gold.\n\n`
        + `${RED}You cannot repick, and not after a normal Random.${END}`,

    [RANDOM_PICK_ITEMS.hybrid]: 'A builder with random towers, one of each price range, from all the races in the game.\n\n'
        + `Gives you ${GOLD}+50${END} gold.\n\n`
        + `${RED}You cannot repick or take a second race.${END} Picking it again rolls new towers.`,

    // Human Town Hall
    'I006': 'The classic. Wall your maze with 5-gold Towers, then upgrade them where they count: '
        + 'Arrow (air and ground), Cannon (splash, ground only) or Arcane (magic splash), each into two more.\n\n'
        + 'Later on, the big towers: the Cold Tower always shoots the creep closest to leaking and slows it, '
        + 'Death Tower and Earth-Fury crush ground waves, and the Dalaran Guard Tower takes down air.\n\n'
        + `${GOLD}Mind the air waves:${END} the Cannon line, Death Tower, Flame Tower and Earth-Fury hit ground only.`,

    // Orc Stronghold
    'I007': 'The Grunt (8 gold) is the cheapest tower. The Headhunter (50) upgrades into the Berserker, '
        + 'which goes berserk as it attacks.\n\n'
        + 'Each of Rokhan\'s hits leaves a Serpent Ward at the target for 5 seconds, and 1 in 20 of '
        + 'Warchief Thrall\'s hits calls forked lightning.\n\n'
        + `${GOLD}Mind the air waves:${END} the Grunt, Barrelmaster and Rexxar hit ground only.`,

    // High Elf Barracks
    'I004': 'The Elven Swordsman (7 gold) is the cheapest tower. The others are bought as they are, from the '
        + 'High Elf Archer (50) to Kael (800); the Archer, Sorceress, Ballista and Kael splash, and Kael '
        + 'casts Locust Swarm as he attacks.\n\n'
        + `${GOLD}Mind the air waves:${END} the Swordsman and the Sorceress hit ground only.`,

    // Outland
    'I005': 'The Chaos Grunt (8 gold) is the cheapest tower, and every Outland tower hits air and ground. '
        + 'The Nether Drake Hatchling (50) grows into the Nether Drake (325).\n\n'
        + 'Rend Blackhand hits for anything from 100 to 10,000, and about 1 in 7 of Magtheridon\'s hits '
        + 'rains fire on the target.',

    // High Elf Farm
    'I025': 'Farms (32 gold) give food: 2 each, 3 once upgraded (12 gold). The animals cost no gold, only '
        + 'food, and each grows twice: the Sheep takes 8, then 16, then 32 food; the Albatross 1, 2 and 4; '
        + 'the Seal 2, 4 and 8; the Crab 4, 8 and 16.\n\n'
        + 'The animals are homesick: they only stand in your own lane. All of them hit air and ground.',

    // Giants Hall
    'I009': 'The Sasquatch (8 gold) is the cheapest tower, and it splashes.\n\n'
        + 'The Ancient Golem gains 75 damage every minute, seven times (+525). The Rock Giant becomes an '
        + 'Infernal Rock Giant after 40 kills. The Iron Golem Statue has no attack: during a wave it sends '
        + 'spikes out around it every 5 seconds. The Ogre Warrior slows what it hits.\n\n'
        + `${GOLD}Mind the air waves:${END} the Ogre Warrior hits ground only.`,

    // Draenei Haven
    'I00D': 'The Draenei Hut (8 gold) is the cheapest tower, and it hits several creeps at once.\n\n'
        + 'The Draenei Seer puts a Lightning Shield on what it attacks, and the Salamander Lord stomps as '
        + 'it attacks.\n\n'
        + `${GOLD}Mind the air waves:${END} the Salamander Hatchling, Salamander Lord and Draenei Demolisher `
        + 'hit ground only.',

    // Corrupted Night Elves
    'I00I': 'The Corrupted Moon Well (8 gold) has no attack: it hurts the creeps near it, and upgrades into '
        + 'the Fountain of Mana (100) and the Fountain of Life (400).\n\n'
        + 'Roots (3 gold) slow ground creeps next to them by 20%, once the Den has researched it. The '
        + 'Corrupted Ancient Protector calls Starfall every 30 seconds during a wave.\n\n'
        + 'Every tower that attacks hits air and ground.',

    // Caerbannog
    'I000': 'The French Soldier (7 gold) is the cheapest tower; creeps near it lose 1 armor.\n\n'
        + 'The Knights Who Say Ni! slow ground creeps within 500 by 25% and hit for anything from 2 to 150, '
        + 'five times a second. Brother Maynard hits for 1,500 every 3 seconds. The Black Beast of Arrrghhh '
        + 'takes 15 armor off every creep within 1,000.\n\n'
        + `${GOLD}Mind the air waves:${END} the Cow Catapult and the Witch Hunter hit ground only.`,

    // Critters UNITE
    'I00L': 'The Mazing Tower (3 gold) has no attack. Each animal hits twice as hard as the one before: '
        + 'the Stag (50 gold) for 25, up to the Black Sheep (1,000 gold) for 1,600. All of them attack '
        + 'twice a second, from 500 range up to 800.\n\n'
        + `${GOLD}Mind the air waves:${END} the Snow Owl hits ground only.`,

    // Forest Troll Hut
    'I00O': 'The Forest Troll (8 gold) is the cheapest tower. The others are bought as they are, up to the '
        + 'Forest Troll Emperor (1,000), and reach far: 700 for the Forest Troll, up to 1,000.\n\n'
        + 'The High Priest calls a Monsoon whenever it is ready, about every 10 seconds.\n\n'
        + `${GOLD}Mind the air waves:${END} the Shadow Priest hits ground only.`,

    // Elementalists
    'I024': 'A puzzle race. Every 8-gold Uncharged Rune offers two of six elements: '
        + 'Water, Fire, Nature, Air, Death and Life.\n\n'
        + 'Siphon one rune onto another: two of an element grow, two different ones fuse into something new '
        + '(Life and Death make the Undead). The siphoned rune turns to rock; Recharge it for 8 gold.\n\n'
        + 'Grown towers gain Attunement every wave. Two of them fuse into a Primal, which Ascends at Attunement 15. '
        + `Your recipe book (${GOLD}-book${END}) keeps every fusion you find.`,
};
