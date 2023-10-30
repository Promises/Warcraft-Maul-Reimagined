/**
 * DO NOT EDIT AS THE SCRIPT BUILDS THIS FILE
*/

interface Quest {
    title: string;
    icon: string;
    stype: number;
    body: string;
}

export const Quests: Quest[] = [
    {
        title: `4.4.2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates:- Automatically prod stuck creeps- Give sligtly more to people with low kills in blitz- Remove [Hotkeys]- Fix file sizes- New action bar, with the example maze button, more buttons to come`,
    },
    {
        title: `4.4.0`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates:- New buttons for beginners to show an example maze- Show arrows for the paths enemies will take`,
    },
    {
        title: `4.3.2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates:- [Naxxramas] was added to the game- New Game mode BLITZ, fight continuous waves Balancing:- [Void Cult] Void Corrupter: Void Corruption damage reduced from 1200 to 800- [Void Cult] Added Mortal Coil and Void Minions- [Gnolls] Changed Gnoll Leader attack cooldown from 0.3s to 0.9s- [Dragons] Reworked the Green Dragon line- [Outland] Chaos Raider now back in Hybrid random- [Humans] Dalaran Guard Tower soft stat buff increasing it's attack speed- [Night Elves] Demonic Illidan increased attack speed and splash slightly- [Night Elves] Reduced the gold cost of Wisp from 8 to 6- [Dwarves] Removed Splash from Dwarf King while increasing his attack speed and damage (experimental)`,
    },
    {
        title: `4.3.1 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Replaced [Outland] Chaos Raiders with a better balanced Anti-Air tower - [High Elven] Archer: Attack cooldown reduced from 1.00 to 0.40 - [High Elven] Spellbreaker: attack cooldown reduced from 0.40 to 0.20, increased range from 400 to 800 - [High Elven] Sorceress: removed the minimum attack range, increased Phoenix Protection damage from 75 to 100 - [High Elven] various changes on tower soft stats - [Demon] Summoning Shrine can't stun Archimonde permanently anymore - Buffed CRAB OF DEATH similar to Archimonde - Added bonus wave 37, credit to Kwaliti for the model - [Corrupted N.Elves] Corrupted Shandris reworked - [Corrupted N.Elves] Corrupted Warden: price reduced from 900 to 650 - [Arachnid] Acid Spitting Spider: increased damage against air from 80 to 125`,
    },
    {
        title: `4.3.1 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Fix a desync related to Timed Action towers - New command -buildings <colour> (Get list of a players hybrid towers) so you can beg even more - Added proper anti-juggle - All desyncs should be fixed Balancing: - New formula for calculating difficulty armour and hitpoints - Lives are now reduced based on HP % left on leaked mobs (max values: 5% normal, 10% champion) - Goblin Blademaster now attacks air like the tooltip states - clarified Ice Troll Joker description, as it does need a slow to work - Nerfed [Summons] - Spirit Bear`,
    },
    {
        title: `4.3.0`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Remove the leaver desync - Fix a desync related to Scavenger getting items - You can now once again -deny/allow/allowall/denyall - When you are denied from a players area, there will be a coloured tower telling you so. - You can now select disabled towers to reenable them - All timed based towers no longer share 1 timerBalancing: - Ogre Lord now has splash range of 200 (ThaOneSmutje) - Uncharged Runes no longer recieve more than 2 options when claimed (ThaOneSmutje) - Fix a bunch of Elementalist towers - Remove dormant pheonix egg mana requirement - Changed Archimondes armor type to Hero - Tinker, Naga Slave and Bronze Dragon can't stun Archimonde anymore`,
    },
    {
        title: `4.2.8`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - When a player leaves, do not desync. - Added 3 event systems, to avoid such desyncs in the future - General stability improvementsBalancing: - Moonstrom (Moon Light) now adds its 800 dmg every 10th attack`,
    },
    {
        title: `4.2.7`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - When a player leaves, proper cleanup should now happen - Implemented an event queue system, to avoid lag when a lot happens - No longer will all abilities trigger when 1 tower does an attack - -allow/deny <colour> and -allowall/denyallBalancing: - Increased Void Worshipper limit from 30 to 40 towers.`,
    },
    {
        title: `4.2.6`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Stability and performance improvements`,
    },
    {
        title: `4.2.5`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Add advanced logging to file - Fixed an issue were no void fragments were ever generated`,
    },
    {
        title: `4.2.4`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Attempt to mitigate some desyncs`,
    },
    {
        title: `4.2.3`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - You can now watch replays`,
    },
    {
        title: `4.2.1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nNotes:    This update, is a complete remake of the map, every trigger has been rewritten in a new language.    There is countless updates, but these are the most noticeable.    Report any bugs found at https://maulbot.com/Updates: - Anti-Block is now pretty much unbeatable - New actual Anti-Juggle [Its disabled because of a bug] - There should be a lot less lag - Added new command -maze to show you example mazes`,
    },
    {
        title: `4.1.2 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - All towers now share the same ground texture - Fixed a bug where the Ice Troll Emperor could kill friendly summoned units - Fixed another bug where people could block - Removed outdated towers from hybrid - Goblin Sapper (now '80' gold, explodes more for more damage) - Forsaken Necromancer (now '75' gold) - Forsaken Solider (Attacks slower, less damage) - Forsaken Archer (Higher damage) - Forsaken Mage (Higher damage) - Champion waves (9, 14, 19...) have been greatly buffed - Anti-air towers rebalanced for new air - Fixed a bug where half of blue spawns would skip yellow - Rebalanced all races around 200% difficulty`,
    },
    {
        title: `4.1.2 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Created a new advanced race The Elementalists - Goblins can now be Hardcore Randomed - Gave builders an ability that makes creeps move - Changed how we write these quests - Hybrid random now only gives you one weeiz. - Added anti-stuck ability - Reworked Unique - Added proper tooltips to [Hybrid] towers - Added hotkeys to [Hybrid] towers - Changes to [Hybrid] - Sniper towers - Minor Changes to other [Hybrid] Towers - Air now spawns like normal waves`,
    },
    {
        title: `4.1.1 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates:Bugfixes and Adjustments - Dragon Egg 15 gold -> 20 gold (now a tier 2 tower in Hybrid Random). - Blue Dragon Whelp and Drake: Lower attack speed, and ground damage. Whelp now 40 gold instead of 35. - Green Dragons: Attack speed and damage up for all. Whelp now 15 gold instead of 20. - Chimaeras now lose life properly again - Gnoll Poacher: Damage from 500 -> 250 - [Galaxy] Star Shooter now has a multi-target attack. Damage lowered by 1. AttackSpeed decreased by .1 - Mutated Frog now sells for the correct amount - Fixed description for Beast of Arrrgh! - Kick command now closes spawn and removes towers of kicked player - Added damage % to armor type descriptions as well as a quest log below the Bugs & Suggestions quest - Removed the critical strike item from Ancient Protector - fixed several bugs with the votekick command`,
    },
    {
        title: `4.1.1 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates:Reworks and Overhauls - UFF has been reworked completely into [Forsaken]. - Chaos Orcs has been rethemed into [Outland]. - [Outland] has had Chaos Shrine, Chaos Kodo, Chaos Pool, and Grom removed. - Aforementioned units are now found in the Secondary Race selector as the [Shrine of Buffs] - [Outland] has been massively buffed and has a new ultimate tower: Magtheridon`,
    },
    {
        title: `4.1.0`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Fixed broken secondary attacks - Fixed armour types on enemies - Fixed some possible ways to block creeps - New loadingscreen with new team members name - Fixed bugged goblin mine - Fixed some spelling - Added Splash to Dragon Towers Missile Targets - Fixed Health Regen on Void and Arachnid - Fixed Hybrid Random - Fixed broken secondary attacks on UFF Archer, and UFF Banshee - Fixed Goblin Blademaster's MirrorImage not working - Fixed a problem with units spawning and not moving`,
    },
    {
        title: `4.0.9`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Updated the damage engine from v3.8.0.0 to v4.0 - Made the checkpoints unbuildable, there was far too many people abusing the buildable checkpoints - Hopefully fixed the Divine Shield - Changed a lot of the tower missiles to prevent desync issues - Fixed the spam Stop on Naga Slave abuse - Increased the cost of the Night Elf Ancient Protector from 150 to 250 - Added descriptive text to Countess' buildings - Added the send command as an alias for give - Fixed a bug where darkgreen could block his spawn - Rebalanced the Gnoll race - Buffed Marine's damage from 5-5 to 7-7 - Reworked dragons and goblins - Fixed Worker's Union autocast - High Elf Farm towers are no longer affected by -dt - Added a -votekick <color> command - Fixed a bug where Alliance of Blades would give you the wrong level 4 item after using the Merchant`,
    },
    {
        title: `4.0.8`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Space Runner now has the correct attack speed - the -dt command no longer disables upgraded Arachnid towers - Alliance of Blades can no longer trade items with non-Alliance towers - Fixed some memory leaks - Flying units should no longer be detected by the anti-juggle system - Created the -give <color> <amount> command - Reworked Obsidian Statue - Slightly buffed the Human Cold Tower - Reworked the Ice Troll Tribe - Disabled the Dragon Turtle as it caused desyncs - Cripple Aura should lag a bit less now - Calmed down the desync and lag issues - Fixed a few anti-block problems - Fixed Adult Green Dragon and Wyvern not working on wave 32`,
    },
    {
        title: `4.0.7`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Various tooltip corrections - Changed Cavernous Creatures mana transfer slightly - Removed Arachnes roar ability - Fixed an exploit with ents spawned by corrupted ancient tower - Fixed fallen archer hitting friendly air units - Chaos Blademaster is now affected by Forest Troll Emp aura - The goblin tesla coil no longer has a BOOM factor\n(GenoHacker) - Fixed hybrid someitmes missing a tower`,
    },
    {
        title: `4.0.6`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Fixed Cavern Hydra attack - Fixed Cavern Hydra sell value - Lazy Fix for cavern turtle using all its mana on its ability - Angel Warrior hotkey is now Q `,
    },
    {
        title: `4.0.5`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - The disable tower system has been re-enabled and works properly - Replaced Hydra Swamp race with Cavernous Creatures race - Increased Death Tower Death Strike chance to 20% - Increased Wisp Explosion Aoe to 800 - Buffed Forest Troll Joker aura slightly - Buffed Summons Avatar of Vengeance - Buffed Gnolls Tier 1 tower - Changed the hotkey of all Tier 1 hotkeys that werent Q, to Q - Disabled Shrine of Ultron race - Disabled Dark Troll race`,
    },
    {
        title: `4.0.4`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Changes to the Ancient Protector and items generated by it - Changed the icons of several buffs - Changed the icon for Mazing Tower - Changed Spirit Hawk attack speed to correct value - Changed price of Hydra Hatchling to 8 gold - Gave Sylvanus Windrunner [High Elves] a projectile, also reduced projectile speed and slightly increased attack speed - Fixed Naga Slave spells not triggering - Fixed Arachnid Regen Aura and Roar not affecting spiders - Corrected coloring and level indicator on God Wand and God Luck items - Cracked Barrel will now spawn 2 spiderlings - Buffed Rexxar and his summons`,
    },
    {
        title: `4.0.3`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Fixed not getting a builder when picking Night Elf`,
    },
    {
        title: `4.0.2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - reworked Night Elves - increased range of Thrall's forked lightning - decreased Draenei Seer's damage - fixed Worker's Union Wisp not autocasting - fixed Mild Mannered Chris not autocasting - fixed Felguard's autocasting - changed Cold Tower's attack to magic - (thanks GenoHacker) - fixed Morning Person and Walk it Off (effects were 10x stronger than intended, ooops!)`,
    },
    {
        title: `4.0.1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - Alliance of Blades and the Void Cult should now work better - fixed Spirit Bear's cost - fixed Worker's Union's Orc Peon - fixed Forest Troll Emperor's damage boost - fixed Dark Green's spawn - fixed Maroon's block detection - fixed several broken creep buffs - added new creep buffs`,
    },
    {
        title: `4.0.0 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - fixed a bug where grey's Fel Hounds didn't spawn - made it easier to level up items later for Alliance of Blades - buffed Moonlight's Moonstorm ability - removed damage boost from Massive Blow - nerfed Ogre Magi's damage from 500 to 350 and splash was lowered from 500 to 400 - lowered Ancient Golem's damage increase from +100 damage every minute to +75 - heavily nerfed the Chaos Boar's damage - fixed Chaos Grunt's damage (his DPS was way below average due to a calculation error I made when I reworked the race) - reduced Chaos Pool's attackspeed buff from 100% to 60% - massive pathing update and flawed block detection added`,
    },
    {
        title: `4.0.0 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 1,
        body: `\nUpdates: - fixed Green and Teal's broken spawns - created a simple anti-juggle - created a script that detects rogue enemies then tries to correct their bad behaviour - reworked Orc Stronghold - reworked Dwarf King tower - (GenoHacker) - fixed God's Book - changed God's Luck description - Alliance of Blades attack speed and damage auras of different levels should now stack - added effects to all Alliance of Blades items`,
    },


   {
        title: 'Commands',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNReplay-Loop.blp',
        stype: bj_QUESTTYPE_OPT_DISCOVERED,
        body: 'List of in-game commands\n\n|cffffcc00-waves|r (shows you information about every wave)\n|cffffcc00-air|r (tells you when air waves are coming)\n|cffffcc00-boss|r (Tells you when boss waves are coming)\n|cffffcc00-champion|r (tells you when champion waves are coming)\n|cffffcc00-light|r (tells you when light armored waves are coming)\n|cffffcc00-medium|r (tells you when medium armored waves are coming)\n|cffffcc00-heavy|r (tells you when heavy armored waves are coming)\n|cffffcc00-fortified|r (tells you when fortified armor waves are coming)\n|cffffcc00-hero|r (tells you when hero armored waves are coming)\n|cffffcc00-sellall|r or |cffffcc00-sa|r (sells all towers given to you when a player left)\n|cffffcc00-claim|r (claims ownership of all towers built in your area.)',
    },
    {
        title: 'Commands 2',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNReplay-Loop.blp',
        stype: bj_QUESTTYPE_OPT_DISCOVERED,
        body: 'List of in-game commands\n\n|cffffcc00-deny <color>|r (denies the specified color access to your spawn and gives their towers to you)\n|cffffcc00-allow <color>|r (allows the specified color access to your spawn)\n|cffffcc00-denyall|r (denies access to your spawn for all players)\n|cffffcc00-allowall|r (allows access to your spawn for all players)\n|cffffcc00-zoom <value>|r (zooms your camera out)\n|cffffcc00-buffs|r (gives detailed information about creep buffs)\n|cffffcc00-dt/-disabletowers|r (disables your basic tier 1 tower that sell for 10 or less gold)\n|cffffcc00-give <color> <amount>|r (gives the specified color a specified amount of gold)\n|cffffcc00-votekick <color>|r (starts a votekick for the specified color)\n-buildings <colour> (Gets List of players hybrid towers)',
    },
    {
        title: 'Bugs & Suggestions',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNReplay-Play.blp',
        stype: bj_QUESTTYPE_OPT_DISCOVERED,
        body: 'If you find a bug or want to suggest a change or feature for our map please post it on maulbot.com and our developers will happily look into it!\n(Please make your post detailed so it\'s easier for us to find the bug or implement your feature)',
    },
    {
        title: 'Armor types',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNHumanArmorUpOne.blp',
        stype: bj_QUESTTYPE_OPT_DISCOVERED,
        body: 'Unarmored takes 150% damage from piercing attacks and 150% damage from siege\nLight takes 200% from piercing and 125% from magic attacks\nMedium takes 150% damage from normal, 75% from piercing, 75% from magic and 50% from siege\nHeavy armor takes 200% damage from magic attacks\nFortified takes 70% from normal, 35% from piercing, 35% from magic, 150% from siege and 50% from hero\n\nAnything unmentioned deals the standard 100% damage',
    },


];
