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

    // Elementalists
    'I024': 'A puzzle race. Every 8-gold Uncharged Rune offers two of six elements: '
        + 'Water, Fire, Nature, Air, Death and Life.\n\n'
        + 'Siphon one rune onto another: two of an element grow, two different ones fuse into something new '
        + '(Life and Death make the Undead). The siphoned rune turns to rock; Recharge it for 8 gold.\n\n'
        + 'Grown towers gain Attunement every wave. Two of them fuse into a Primal, which Ascends at Attunement 15. '
        + `Your recipe book (${GOLD}-book${END}) keeps every fusion you find.`,
};
