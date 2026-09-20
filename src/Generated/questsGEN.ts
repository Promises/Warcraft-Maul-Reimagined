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
        title: `5.0.0 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n- Fixed: void fragments are refunded when a bought building is cancelled\n- Fixed: the last row of the Blue, Gray, Brown and Maroon lanes can be built on\n- Fixed: abilities broken in the rewrite (Void items, base damage of several towers, Draenei Seer, Ancient Protector, Hydralisk, Adventurer, Cavern Hermit, Pay the Toll)\n- Fixed: hybrid towers could be built on checkpoints\n- Fixed: Wyvern lightning range, Iron Golem spike directions\n- Anti-block and anti-juggle are faster and cancel instantly\n- Host detection works on every platform, so host-only settings are reliable`,
    },
    {
        title: `5.0.0 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n- The map has been rebuilt from the ground up for Warcraft III 2.0 (new script engine)\n- Race selection is a panel: browse races by tier, read what each one does, then pick. The race shops are gone\n- Hybrid random gets a build menu with your nine rolled towers: click one, then click the grid to build (shift to keep building)\n- The host picks game mode and difficulty, or hands it to a vote. Votes no longer block the screen; the difficulty vote runs while races are picked\n- -gray: when the gray lane is empty, take it over. Your towers, builders and units move with you and you become the last defender\n- Range check: -range or the action bar button shows the attack range of any tower you select\n- New action bar: sample maze, claim towers, build menu, race selection, range check\n- Difficulty scales creep health and armor only (a hidden second multiplier is gone)`,
    },
    {
        title: `4.4.2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n- Automatically prod stuck creeps\n- Give sligtly more to people with low kills in blitz\n- Remove [Hotkeys]\n- Fix file sizes\n- New action bar, with the example maze button, more buttons to come`,
    },
    {
        title: `4.4.0`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n- New buttons for beginners to show an example maze\n- Show arrows for the paths enemies will take`,
    },
    {
        title: `4.3.2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n- [Naxxramas] was added to the game\n- New Game mode BLITZ, fight continuous waves\n \nBalancing:\n- [Void Cult] Void Corrupter: Void Corruption damage reduced from 1200 to 800\n- [Void Cult] Added Mortal Coil and Void Minions\n- [Gnolls] Changed Gnoll Leader attack cooldown from 0.3s to 0.9s\n- [Dragons] Reworked the Green Dragon line\n- [Outland] Chaos Raider now back in Hybrid random\n- [Humans] Dalaran Guard Tower soft stat buff increasing it's attack speed\n- [Night Elves] Demonic Illidan increased attack speed and splash slightly\n- [Night Elves] Reduced the gold cost of Wisp from 8 to 6\n- [Dwarves] Removed Splash from Dwarf King while increasing his attack speed and damage (experimental)`,
    },
    {
        title: `4.3.1 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Nerfed [Summons] - Spirit Bear\n - Replaced [Outland] Chaos Raiders with a better balanced Anti-Air tower\n - [High Elven] Archer: Attack cooldown reduced from 1.00 to 0.40\n - [High Elven] Spellbreaker: attack cooldown reduced from 0.40 to 0.20, increased range from 400 to 800\n - [High Elven] Sorceress: removed the minimum attack range, increased Phoenix Protection damage from 75 to 100\n - [High Elven] various changes on tower soft stats\n - [Demon] Summoning Shrine can't stun Archimonde permanently anymore\n - Buffed CRAB OF DEATH similar to Archimonde\n - Added bonus wave 37, credit to Kwaliti for the model\n - [Corrupted N.Elves] Corrupted Shandris reworked\n - [Corrupted N.Elves] Corrupted Warden: price reduced from 900 to 650\n - [Arachnid] Acid Spitting Spider: increased damage against air from 80 to 125`,
    },
    {
        title: `4.3.1 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Fix a desync related to Timed Action towers\n - New command -buildings <colour> (Get list of a players hybrid towers) so you can beg even more\n - Added proper anti-juggle\n - All desyncs should be fixed\n \nBalancing:\n - New formula for calculating difficulty armour and hitpoints\n - Lives are now reduced based on HP % left on leaked mobs (max values: 5% normal, 10% champion)\n - Goblin Blademaster now attacks air like the tooltip states\n - clarified Ice Troll Joker description, as it does need a slow to work`,
    },
    {
        title: `4.3.0`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Remove the leaver desync\n - Fix a desync related to Scavenger getting items\n - You can now once again -deny/allow/allowall/denyall\n - When you are denied from a players area, there will be a coloured tower telling you so.\n - You can now select disabled towers to reenable them\n - All timed based towers no longer share 1 timer\n\nBalancing:\n - Ogre Lord now has splash range of 200 (ThaOneSmutje)\n - Uncharged Runes no longer recieve more than 2 options when claimed (ThaOneSmutje)\n - Fix a bunch of Elementalist towers\n - Remove dormant pheonix egg mana requirement\n - Changed Archimondes armor type to Hero\n - Tinker, Naga Slave and Bronze Dragon can't stun Archimonde anymore`,
    },
    {
        title: `4.2.8`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - When a player leaves, do not desync.\n - Added 3 event systems, to avoid such desyncs in the future\n - General stability improvements\n\nBalancing:\n - Moonstrom (Moon Light) now adds its 800 dmg every 10th attack`,
    },
    {
        title: `4.2.7`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - When a player leaves, proper cleanup should now happen\n - Implemented an event queue system, to avoid lag when a lot happens\n - No longer will all abilities trigger when 1 tower does an attack\n - -allow/deny <colour> and -allowall/denyall\n\nBalancing:\n - Increased Void Worshipper limit from 30 to 40 towers.`,
    },
    {
        title: `4.2.6`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Stability and performance improvements`,
    },
    {
        title: `4.2.5`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Add advanced logging to file\n - Fixed an issue were no void fragments were ever generated`,
    },
    {
        title: `4.2.4`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Attempt to mitigate some desyncs`,
    },
    {
        title: `4.2.3`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - You can now watch replays`,
    },
    {
        title: `4.2.1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Notes:\n    This update, is a complete remake of the map, every trigger has been rewritten in a new language.\n    There is countless updates, but these are the most noticeable.\n    Report any bugs found at https://maulbot.com/\nUpdates:\n - Anti-Block is now pretty much unbeatable\n - New actual Anti-Juggle [Its disabled because of a bug]\n - There should be a lot less lag\n - Added new command -maze to show you example mazes`,
    },
    {
        title: `4.1.2 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - All towers now share the same ground texture\n - Fixed a bug where the Ice Troll Emperor could kill friendly summoned units\n - Fixed another bug where people could block\n - Removed outdated towers from hybrid\n - Goblin Sapper (now '80' gold, explodes more for more damage)\n - Forsaken Necromancer (now '75' gold)\n - Forsaken Solider (Attacks slower, less damage)\n - Forsaken Archer (Higher damage)\n - Forsaken Mage (Higher damage)\n - Champion waves (9, 14, 19...) have been greatly buffed\n - Anti-air towers rebalanced for new air\n - Fixed a bug where half of blue spawns would skip yellow\n - Rebalanced all races around 200% difficulty`,
    },
    {
        title: `4.1.2 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Created a new advanced race The Elementalists\n - Goblins can now be Hardcore Randomed\n - Gave builders an ability that makes creeps move\n - Changed how we write these quests\n - Hybrid random now only gives you one weeiz.\n - Added anti-stuck ability\n - Reworked Unique\n - Added proper tooltips to [Hybrid] towers\n - Added hotkeys to [Hybrid] towers\n - Changes to [Hybrid] - Sniper towers\n - Minor Changes to other [Hybrid] Towers\n - Air now spawns like normal waves`,
    },
    {
        title: `4.1.1 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\nBugfixes and Adjustments\n - Dragon Egg 15 gold -> 20 gold (now a tier 2 tower in Hybrid Random).\n - Blue Dragon Whelp and Drake: Lower attack speed, and ground damage. Whelp now 40 gold instead of 35.\n - Green Dragons: Attack speed and damage up for all. Whelp now 15 gold instead of 20.\n - Chimaeras now lose life properly again\n - Gnoll Poacher: Damage from 500 -> 250\n - [Galaxy] Star Shooter now has a multi-target attack. Damage lowered by 1. AttackSpeed decreased by .1\n - Mutated Frog now sells for the correct amount\n - Fixed description for Beast of Arrrgh!\n - Kick command now closes spawn and removes towers of kicked player\n - Added damage % to armor type descriptions as well as a quest log below the Bugs & Suggestions quest\n - Removed the critical strike item from Ancient Protector\n - fixed several bugs with the votekick command`,
    },
    {
        title: `4.1.1 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\nReworks and Overhauls\n - UFF has been reworked completely into [Forsaken].\n - Chaos Orcs has been rethemed into [Outland].\n - [Outland] has had Chaos Shrine, Chaos Kodo, Chaos Pool, and Grom removed.\n - Aforementioned units are now found in the Secondary Race selector as the [Shrine of Buffs]\n - [Outland] has been massively buffed and has a new ultimate tower: Magtheridon\n\n`,
    },
    {
        title: `4.1.0`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Fixed broken secondary attacks\n - Fixed armour types on enemies\n - Fixed some possible ways to block creeps\n - New loadingscreen with new team members name\n - Fixed bugged goblin mine\n - Fixed some spelling\n - Added Splash to Dragon Towers Missile Targets\n - Fixed Health Regen on Void and Arachnid\n - Fixed Hybrid Random\n - Fixed broken secondary attacks on UFF Archer, and UFF Banshee\n - Fixed Goblin Blademaster's MirrorImage not working\n - Fixed a problem with units spawning and not moving`,
    },
    {
        title: `4.0.9`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Updated the damage engine from v3.8.0.0 to v4.0\n - Made the checkpoints unbuildable, there was far too many people abusing the buildable checkpoints\n - Hopefully fixed the Divine Shield\n - Changed a lot of the tower missiles to prevent desync issues\n - Fixed the spam Stop on Naga Slave abuse\n - Increased the cost of the Night Elf Ancient Protector from 150 to 250\n - Added descriptive text to Countess' buildings\n - Added the send command as an alias for give\n - Fixed a bug where darkgreen could block his spawn\n - Rebalanced the Gnoll race\n - Buffed Marine's damage from 5-5 to 7-7\n - Reworked dragons and goblins\n - Fixed Worker's Union autocast\n - High Elf Farm towers are no longer affected by -dt\n - Added a -votekick <color> command\n - Fixed a bug where Alliance of Blades would give you the wrong level 4 item after using the Merchant`,
    },
    {
        title: `4.0.8`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Space Runner now has the correct attack speed\n - the -dt command no longer disables upgraded Arachnid towers\n - Alliance of Blades can no longer trade items with non-Alliance towers\n - Fixed some memory leaks\n - Flying units should no longer be detected by the anti-juggle system\n - Created the -give <color> <amount> command\n - Reworked Obsidian Statue\n - Slightly buffed the Human Cold Tower\n - Reworked the Ice Troll Tribe\n - Disabled the Dragon Turtle as it caused desyncs\n - Cripple Aura should lag a bit less now\n - Calmed down the desync and lag issues\n - Fixed a few anti-block problems\n - Fixed Adult Green Dragon and Wyvern not working on wave 32`,
    },
    {
        title: `4.0.7`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Various tooltip corrections\n - Changed Cavernous Creatures mana transfer slightly\n - Removed Arachnes roar ability\n - Fixed an exploit with ents spawned by corrupted ancient tower\n - Fixed fallen archer hitting friendly air units\n - Chaos Blademaster is now affected by Forest Troll Emp aura\n - The goblin tesla coil no longer has a BOOM factor\n(GenoHacker)\n - Fixed hybrid someitmes missing a tower`,
    },
    {
        title: `4.0.6`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Fixed Cavern Hydra attack\n - Fixed Cavern Hydra sell value\n - Lazy Fix for cavern turtle using all its mana on its ability\n - Angel Warrior hotkey is now Q`,
    },
    {
        title: `4.0.5`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - The disable tower system has been re-enabled and works properly\n - Replaced Hydra Swamp race with Cavernous Creatures race\n - Increased Death Tower Death Strike chance to 20%\n - Increased Wisp Explosion Aoe to 800\n - Buffed Forest Troll Joker aura slightly\n - Buffed Summons Avatar of Vengeance\n - Buffed Gnolls Tier 1 tower\n - Changed the hotkey of all Tier 1 hotkeys that werent Q, to Q\n - Disabled Shrine of Ultron race\n - Disabled Dark Troll race`,
    },
    {
        title: `4.0.4`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Changes to the Ancient Protector and items generated by it\n - Changed the icons of several buffs\n - Changed the icon for Mazing Tower\n - Changed Spirit Hawk attack speed to correct value\n - Changed price of Hydra Hatchling to 8 gold\n - Gave Sylvanus Windrunner [High Elves] a projectile, also reduced projectile speed and slightly increased attack speed\n - Fixed Naga Slave spells not triggering\n - Fixed Arachnid Regen Aura and Roar not affecting spiders\n - Corrected coloring and level indicator on God Wand and God Luck items\n - Cracked Barrel will now spawn 2 spiderlings\n - Buffed Rexxar and his summons`,
    },
    {
        title: `4.0.3`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Fixed not getting a builder when picking Night Elf`,
    },
    {
        title: `4.0.2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - reworked Night Elves\n - increased range of Thrall's forked lightning\n - decreased Draenei Seer's damage\n - fixed Worker's Union Wisp not autocasting\n - fixed Mild Mannered Chris not autocasting\n - fixed Felguard's autocasting\n - changed Cold Tower's attack to magic\n - (thanks GenoHacker)\n - fixed Morning Person and Walk it Off (effects were 10x stronger than intended, ooops!)`,
    },
    {
        title: `4.0.1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - Alliance of Blades and the Void Cult should now work better\n - fixed Spirit Bear's cost\n - fixed Worker's Union's Orc Peon\n - fixed Forest Troll Emperor's damage boost\n - fixed Dark Green's spawn\n - fixed Maroon's block detection\n - fixed several broken creep buffs\n - added new creep buffs`,
    },
    {
        title: `4.0.0 - 2`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - added effects to all Alliance of Blades items\n - fixed a bug where grey's Fel Hounds didn't spawn\n - made it easier to level up items later for Alliance of Blades\n - buffed Moonlight's Moonstorm ability\n - removed damage boost from Massive Blow\n - nerfed Ogre Magi's damage from 500 to 350 and splash was lowered from 500 to 400\n - lowered Ancient Golem's damage increase from +100 damage every minute to +75\n - heavily nerfed the Chaos Boar's damage\n - fixed Chaos Grunt's damage (his DPS was way below average due to a calculation error I made when I reworked the race)\n - reduced Chaos Pool's attackspeed buff from 100% to 60%\n - massive pathing update and flawed block detection added`,
    },
    {
        title: `4.0.0 - 1`,
        icon: `ReplaceableTextures\\CommandButtons\\BTNAmbush.blp`,
        stype: 0,
        body: `Updates:\n - fixed Green and Teal's broken spawns\n - created a simple anti-juggle\n - created a script that detects rogue enemies then tries to correct their bad behaviour\n - reworked Orc Stronghold\n - reworked Dwarf King tower\n - (GenoHacker)\n - fixed God's Book\n - changed God's Luck description\n - Alliance of Blades attack speed and damage auras of different levels should now stack`,
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
        body: 'List of in-game commands\n\n|cffffcc00-deny <color>|r (denies the specified color access to your spawn and gives their towers to you)\n|cffffcc00-allow <color>|r (allows the specified color access to your spawn)\n|cffffcc00-denyall|r (denies access to your spawn for all players)\n|cffffcc00-allowall|r (allows access to your spawn for all players)\n|cffffcc00-zoom <value>|r (zooms your camera out)\n|cffffcc00-buffs|r (gives detailed information about creep buffs)\n|cffffcc00-dt/-disabletowers|r (disables your basic tier 1 tower that sell for 10 or less gold)\n|cffffcc00-give <color> <amount>|r (gives the specified color a specified amount of gold)\n|cffffcc00-votekick <color>|r (starts a votekick for the specified color)\n|cffffcc00-buildings <colour>|r (lists a player\'s hybrid towers)',
    },
    {
        title: 'Commands 3',
        icon: 'ReplaceableTextures\\CommandButtons\\BTNReplay-Loop.blp',
        stype: bj_QUESTTYPE_OPT_DISCOVERED,
        body: 'List of in-game commands\n\n|cffffcc00-race|r (opens or closes the race selection)\n|cffffcc00-build|r (opens or closes the hybrid build menu)\n|cffffcc00-range|r (toggles range check: select a tower to see its attack range)\n|cffffcc00-gray|r (takes over the gray lane when nobody holds it; your towers, builders and units move with you)\n|cffffcc00-maze 1|r, |cffffcc00-maze 2|r, |cffffcc00-maze 3|r (shows a sample maze in your lane; |cffffcc00-maze none|r removes it)\n|cffffcc00-host|r (shows who the game host is)',
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
