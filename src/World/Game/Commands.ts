import {WarcraftMaul} from '../WarcraftMaul';
import {COLOUR_CODES} from '../GlobalSettings';
import {Defender} from '../Entity/Players/Defender';
import {Log} from '../../lib/Serilog/Serilog';
import {CheckPoint} from '../Entity/CheckPoint';
import {AdvancedHoloMaze} from '../Holograms/AdvancedHoloMaze';
import {SimpleHoloMaze} from '../Holograms/SimpleHoloMaze';
import {CircleHoloMaze} from '../Holograms/CircleHoloMaze';
import {Rectangle} from '../../JassOverrides/Rectangle';
import {SpawnedCreeps} from '../Entity/SpawnedCreeps';
import {TimedEvent} from '../../lib/WCEventQueue/TimedEvent';
import {DummyPlayer} from '../Entity/EmulatedPlayer/DummyPlayer';
import {Maze, Walkable} from '../Antiblock/Maze';
import {COLOUR, DecodeFourCC, SendMessage, Util} from "../../lib/translators";
import {Frame, MapPlayer, Timer, Trigger, Unit} from "w3ts";
import {Image} from "../../JassOverrides/Image";
import {CustomBuildMenu} from "./Ui/BuildMenu";
import {BoxText} from "./Ui/BoxText";

/**
 * Gets a random number between a range.
 */
function RandomChoice<T>(a: Array<T>): T {
    return a[Math.floor(Math.random() * a.length)];
}

export class Commands {

    public commandTrigger: Trigger;
    public game: WarcraftMaul;
    private voteKickInProgress: boolean = false;
    private voteAgainstPlayer: Defender | undefined;
    private hasVotedToKick: boolean[] = [];
    private voteKickTimer: timer = CreateTimer();
    private drawings: Image[][] = [];
    private points: Image[] = [];


    constructor(game: WarcraftMaul) {
        this.game = game;
        this.commandTrigger = Trigger.create();

        this.commandTrigger.addAction(() => this.handleCommand());
        for (let i: number = 0; i < bj_MAX_PLAYER_SLOTS; i++) {
            this.hasVotedToKick[i] = false;
        }
    }

    private handleDebugCommand(player: Defender, command: string[], command2: string[]): void {
        Log.Debug(Util.ArraysToString(command));
        let amount: number = 0;
        switch (command[0]) {
            case 'dummy':
                // const dummy1: DummyPlayer = new DummyPlayer(this.game, 11);
                // const dummy2: DummyPlayer = new DummyPlayer(this.game, 12);
                // const dummy3: DummyPlayer = new DummyPlayer(this.game, 10);
                // const dummy4: DummyPlayer = new DummyPlayer(this.game, 9);
                // const dummy5: DummyPlayer = new DummyPlayer(this.game, 8);
                // const dummy6: DummyPlayer = new DummyPlayer(this.game, 7);
                // const dummy7: DummyPlayer = new DummyPlayer(this.game, 6);
                // const dummy8: DummyPlayer = new DummyPlayer(this.game, 5);
                // const dummy9: DummyPlayer = new DummyPlayer(this.game, 4);
                // const dummy10: DummyPlayer = new DummyPlayer(this.game, 3);
                // const dummy11: DummyPlayer = new DummyPlayer(this.game, 2);

                break;
            case 'ui':
                const b = new BoxText('DUMMY')

                b.setTitle('TiTLTLTTL')
                    .setValue('DESCIRPTION')
                    .setPosition(0.4, 0.3)    // Center of screen
                    .setSize(0.25, 0.15)      // 25% width, 15% height
                    .show();
                break;
            case 'openall':
                player.sendMessage('All spawns are now open!');
                this.OpenAllSpawns();
                break;
            case 'gold':
                amount = Util.ParseInt(command[1]);
                if (!amount) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;
                }
                player.sendMessage(`Gold was set to |cFFFFCC00${amount}|r`);
                player.setGold(amount);
                break;
            case 'lumber':
                amount = Util.ParsePositiveInt(command[1]);
                if (!amount) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;

                }
                player.sendMessage(`Lumber was set to |cFF00C850${amount}|r`);
                player.setLumber(amount);
                break;
            case 'lives':
                amount = Util.ParseInt(command[1]);
                if (!amount) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;

                }
                amount = Math.floor(Number(amount));
                this.game.gameLives = amount;
                this.game.startLives = amount;
                player.sendMessage(`Lives were set to |cFFFFCC00${amount}|r`);
                break;
            case 'closeall':
                player.sendMessage('All spawns are now closed!');
                this.CloseAllSpawns();

                break;
            // case 'item':
            //     // player.hybridBuilder?.useItem(player.hybridBuilder?.getItemInSlot(1)!);
            //
            //     print(BlzGetUnitStringField(player.hybridBuilder!.handle, ConvertUnitStringField(FourCC('ubui'))!))
            //     print(BlzSetUnitStringField(player.hybridBuilder!.handle, ConvertUnitStringField(FourCC('ubui'))!, ''))
            //
            //
            //
            //     break;
            // case 'up':
            //     Log.Debug('Keys')
            //     const whichToEnable = Object.keys(HybridSpells);
            //     Log.Debug(`Choice ${whichToEnable}`)
            //
            //     const randomChoice = RandomChoice(whichToEnable);
            //     Log.Debug(`Grab ${randomChoice}`)
            //
            //     const toEnable = HybridSpells[randomChoice]
            //     Log.Debug(`Should enable`)
            //     Log.Debug(`Should enable ${toEnable.newId}`)
            //
            //     for (const spell of Object.values(HybridSpells)) {
            //         let ability = player.hybridBuilder?.getAbility(FourCC(spell.newId));
            //         Log.Debug(`Setting ${spell.newId} ${spell.newId === toEnable.newId ? 'enable': 'disable'}`)
            //         player.hybridBuilder?.removeAbility(BlzGetAbilityId(ability!));
            //         if(spell.newId === toEnable.newId) {
            //             // player.hybridBuilder?.addAbility(FourCC(spell.newId))
            //             // player.hybridBuilder?.setAbilityLevel(FourCC(spell.newId), player.hybridTowers[parseInt(randomChoice)].level)
            //         }
            //     }
            //     // player.hybridBuilder?.issueImmediateOrder('cannibalize');
            //     const ability = HybridSpells['0']
            //     player.hybridBuilder?.addAbility(FourCC(toEnable.newId));
            //     // player.hybridBuilder?.disableAbility()
            //     player.hybridBuilder?.setAbilityLevel(FourCC(toEnable.newId), player.hybridTowers[parseInt(randomChoice)].level)
            //     // player.hybridBuilder?.addAbility(FourCC('AIbt'));
            //     // player.hybridBuilder?.addAbility(FourCC('AIbl'));
            //     // player.hybridBuilder?.addAbility(FourCC('AIbg'));
            //     // player.hybridBuilder?.addAbility(FourCC('AIbb'));
            //     // player.hybridBuilder?.addAbility(FourCC('AIbf'));
            //     // player.hybridBuilder?.addAbility(FourCC('AIbr'));
            //     // player.hybridBuilder?.addAbility(FourCC('AIbs'));
            //     // player.hybridBuilder?.addAbility(FourCC('AIbh'));
            //     player.hybridBuilder?.addItemById(FourCC('itxb'));
            //     player.hybridBuilder?.addItemById(FourCC('itxb'));
            //     player.hybridBuilder?.addItemById(FourCC('itxb'));
            //     player.hybridBuilder?.addItemById(FourCC('itxb'));
            //     player.hybridBuilder?.addItemById(FourCC('itxb'));
            //     player.hybridBuilder?.addItemById(FourCC('itxb'));
            //
            //
            //
            //
            //     // const abilityId = HybridSpells['1'].newId;
            //     // const newValue = !player.metadata['abilityEnabled'];
            //
            //     if (player.isLocal()) {
            //         // BlzFrameClick(BlzGetFrameByName("InventoryButton_0", 0)!);
            //
            //         // Log.Debug(BlzGetOriginFrame(ORIGIN_FRAME_COMMAND_BUTTON, 0))
            //         // let commandButtonFrame = BlzGetOriginFrame(ORIGIN_FRAME_COMMAND_BUTTON, 0);
            //         // const childCount =BlzFrameGetChildrenCount(commandButtonFrame!);
            //         const numberOfButtons = 12; // This is a typical number, but it may vary
            //
            //         for (let i = 0; i < numberOfButtons; i++) {
            //             let abilityButton = Frame.fromName("CommandButton_" + i, 0);
            //             Log.Debug(abilityButton?.id && `${abilityButton?.id}` || `${i} not found`);
            //         }
            //         //
            //         //     // Perform your operations with the abilityButton here
            //         //     // For example, checking if this ability is the one you're looking for
            //         // }
            //
            //
            //     }
            //
            //
            //     // print(abilityId);
            //     // player.hybridBuilder?.incAbilityLevel(FourCC(abilityId))
            //     // const level = player.hybridBuilder?.getAbilityLevel(FourCC(abilityId))
            //     // print(level);
            //     //
            //     // BlzSetAbilityIcon(BlzGetAbilityId(ability!), HybridTierOne.find(a => a.level === level)?.icon!);
            //     break;

            case "test":
                // for (let i = 0; i <= 11; i++) {
                //     const button = Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, i);
                //     if (button) {
                //         const frame = Frame.createSimple("commandButtonTooltip" + i, button, 0);
                //         if (frame) {
                //             frame.setVisible(false);
                //             frame.setText('YOLO'
                //             )
                //             button.setTooltip(frame);
                //             // this.commandButtonTooltip[i] = frame;
                //         }
                //     }
                //     // const frame = Frame.createSimple('SIMPLEFRAME', button);
                //     // frame.setTooltip(button);
                //     // frame.setVisible(false);
                //     // CommandButtonTooltip.commandButtonTooltip[i] = frame;
                // }

                // const TT = Frame.fromOrigin(ORIGIN_FRAME_UBERTOOLTIP, 0);
                //
                // print(TT?.setVisible(false))

                // const frame = Frame.fromName('CommandButton_0', 0);
                // const button = Frame.createType("MyIconButton", Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!, 0, "BUTTON", "ScoreScreenTabButtonTemplate");
                // Log.Debug('Created btn');
                // const buttonIconFrame = Frame.createType("MyIconButtonIcon", button!, 0, "BACKDROP", "");
                // Log.Debug('Created icon');
                //
                // buttonIconFrame?.setAllPoints(button!);
                // Log.Debug('Set all points');
                //
                // button?.setAbsPoint(FRAMEPOINT_CENTER, 0.1, 0.3);
                // Log.Debug('Set abs points');
                // //
                // button?.setSize(0.3, 0.3)
                // Log.Debug('Set size points');
                //
                // buttonIconFrame?.setTexture("Replaceabletextures\\CommandButtons\\BTNArthas", 0, false)
                // Log.Debug('Set texture points');

                // Log.Debug(`${frame?.childrenCount}`);
                // // Log.Debug(`${frame?.setTexture()}`);
                // Log.Debug(BlzFrameGetName(frame!.handle)!)
                // Log.Debug(BlzFrameGetName(frame?.getChild(0)!.handle!)!)
                // frame?.getChild(0)?.setAlpha(125);
                // print(frame?.text)
                // print(frame?.getChild(0)?.text)
                // print(frame?.getChild(0)?.id)
                // let index = 0;
                // // Assuming there are 12 command buttons
                // do {
                //     const frame = BlzCreateFrame("CDText", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0)!, 0, 0);
                //     // CommandButtonOverLayText[BlzGetOriginFrame(ORIGIN_FRAME_COMMAND_BUTTON, index)] = frame;
                //     BlzFrameSetAllPoints(frame!, BlzGetOriginFrame(ORIGIN_FRAME_COMMAND_BUTTON, index)!);
                //     BlzFrameSetText(frame!, "A"); // Set text to "A"
                //     BlzFrameSetVisible(frame!, true);
                //     index++;
                // } while (index < 12);

                // function addShortcutTextToButton(): void {
                //     const playerIndex = Defender.fromLocal();
                //     const firstButtonFrameName = `CommandButton_0`;
                //
                //     // Try finding the first command button
                //     const firstCommandButton = Frame.fromName(firstButtonFrameName, 0);
                //
                //     // Verify if the first command button was found
                //     if (!firstCommandButton) {
                //         Log.Error(`Could not find command button with name: ${firstButtonFrameName}`);
                //         return; // Early exit if the target button was not found
                //     }
                //     // Create a new text frame as a child of the first command button
                //     const firstButtonShortcutTextFrame = Frame.createType("FirstButtonShortcut", firstCommandButton, 0, "TEXT", "");
                //
                //     // Set the text for the shortcut key
                //     firstButtonShortcutTextFrame?.setText('Q');
                // // }

                //

                let currentSelectedButtonIndex: number | null = null;
                let currentbuttoncount: number | null = null;
                const commandButtonTooltip: Frame[] = [];

                // Create one tooltip frame for each command button
                for (let i = 0; i < 12; i++) {
                    const button = Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, i);
                    if (button) {
                        const frame = Frame.createType('', button, 0, "SIMPLEFRAME", '');
                        // const frame = Frame.createSimple('', button, 0);
                        button.setTooltip(frame!);
                        frame!.visible = false;
                        print(`${i} set hidden`);
                        commandButtonTooltip[i] = frame!;
                    }
                }

                const indexes = [0, 1, 2, 4, 5, 6, 8, 9, 10];
                const hybridFrames: Frame[] = []
                for (let i = 0; i < player.hybridTowers.length; i++) {
                    const hybridTower = player.hybridTowers[i];
                    const renderIndx = indexes[i];
                    const frame = Frame.createType("", Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!, 0, "BACKDROP", "");
                    frame?.setAllPoints(Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, renderIndx)!)
                    frame?.setTexture(hybridTower.icon ? hybridTower.icon : '', 0, true)
                    frame?.setVisible(false);
                    hybridFrames.push(frame!);
                }


                // const frame = BlzCreateFrameByType("BACKDROP", "", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0)!, "", 0)
                // BlzFrameSetAllPoints(frame!, BlzGetOriginFrame(ORIGIN_FRAME_COMMAND_BUTTON, 0)!)
                // BlzFrameSetTexture(frame!, 'ReplaceableTextures\\WorldEditUI\\Doodad-Cinematic.blp', 0, true);

                // iconFrame!.setSize(0.03, 0.03);

                // iconFrame!.setAbsPoint(FRAMEPOINT_TOPLEFT, 0.1, 0.45);

                print(`Create timer`);


                // Create the main frame
                const box = new BoxText('Test')

                box
                    .setTitle('TiTLTLTTL')
                    .setValue('DESCIRPTION')
                    .setPosition(0.4, 0.3)    // Center of screen
                    .setSize(0.25, 0.15)      // 25% width, 15% height
                    .show();
                // Create the BoxedText frame
                // let tooltip = Frame.create("BoxedText", Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!, 0, 0);
                // if (!tooltip) {
                //     throw new Error('Could not create the tooltip frame.');
                // }
                //
                // tooltip.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, 0.825, 0.16);
                // tooltip.setSize(0.315, 0);
                // tooltip.visible = false;
                //
                // let tooltipValueFrame = Frame.fromName("BoxedTextValue", 0);
                // if (!tooltipValueFrame) {
                //     throw new Error('Could not find the tooltip value frame.');
                // }
                //
                // tooltipValueFrame.text = "Human Paladin Face, but it is not uther.";
                //
                // let tooltipTitleFrame = Frame.fromName("BoxedTextTitle", 0);
                // if (!tooltipTitleFrame) {
                //     throw new Error('Could not find the tooltip title frame.');
                // }
                //
                // tooltipTitleFrame.text = "Paladin";
                // If the currently selected button is not null or undefined, create a timer loop
                const hoversCommandButton = (commandButtonIndex: number | null) => {

                    // let tooltip = Frame.fromName("BoxedText", 0);
                    Log.Debug("Hover button " + commandButtonIndex);

                    if (box != null) {
                        if (commandButtonIndex == null) {
                            box.hide();
                        } else {
                            // let unit = Unit.fromHandle(GetEnumUnit());
                            // let item = unit.itemInSlot(commandButtonIndex);
                            //
                            // if (item != null) {
                            const TT = Frame.fromOrigin(ORIGIN_FRAME_UBERTOOLTIP, 0);
                            TT?.setVisible(false)

                            box.show()
                            // const tow = player.hybridTowers[0];
                            // // assuming Equipment is a custom class and getByHandle is a method of that class
                            // let itemName = GetLocalizedString(tow.toolTipBasic) || '';
                            // let itemDesc = GetLocalizedString(tow.toolTipExtended) || '';
                            // let goldValue = tow.goldCost;
                            //
                            // let childTitle = Frame.fromName("BoxedTextTitle", 0);
                            // if (childTitle) {
                            //     childTitle.text = itemName;
                            // }
                            //
                            // let childValue = Frame.fromName("BoxedTextValue", 0);
                            // if (childValue) {
                            //     childValue.text = itemDesc;
                            // }
                            //
                            // let childGoldValue = Frame.fromName("BoxedTextGoldValue", 0);
                            // if (childGoldValue) {
                            //     childGoldValue.text = `${goldValue}`;
                            // }
                            // }
                        }
                    }
                }

                const areButtonsVisible = (): boolean => {
                    for (let i = 0; i < 12; i++) {
                        // Skip indices 3 and 7
                        if (i === 3 || i === 7) {
                            continue;
                        }
                        const button = Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, i)!;


                        if (!button.visible) {
                            return false;
                        }
                    }
                    return true;
                }
                Timer.create().start(1.0 / 32, true, () => {
                    let selectedAnything = false;
                    let shouldBeVisible = areButtonsVisible();

                    for (const hybridFrame of hybridFrames) {
                        if (hybridFrame.visible !== shouldBeVisible) {
                            hybridFrame.setVisible(shouldBeVisible);
                        }
                    }

                    if(!shouldBeVisible) {
                        if(currentSelectedButtonIndex != null) {
                            hoversCommandButton(null);
                        }
                        currentSelectedButtonIndex = null;
                        return;
                    }
                    // Loop all tooltips and check for the visible one
                    for (let i = 0; i < 11; i++) {

                        if (commandButtonTooltip[i].visible) {
                            selectedAnything = true;

                            // The new selected is not the same as the current one?
                            if (currentSelectedButtonIndex !== i) {
                                print(shouldBeVisible ? 'Visible' : 'Not Visible');
                                hoversCommandButton(i);
                            }
                            currentSelectedButtonIndex = i;
                        }
                    }

                    // Now selects nothing?
                    if (!selectedAnything && currentSelectedButtonIndex != null) {
                        hoversCommandButton(null);
                        currentSelectedButtonIndex = null;
                    }
                });
                print(`Timer created`);


                // frame?.setTexture("ReplaceableTextures\\CommandButtons\\BTNHeroPaladin", 0, true)
                // frame?.getChild(0)?.setTexture("ReplaceableTextures\\CommandButtons\\BTNHeroPaladin", 0, true)
                // const t = new Trigger()
                // t.registerGameEvent(EVENT_GAME_BUILD_SUBMENU)
                // t.addAction(() => {
                //     for (let i = 0; i <= 11; i++) {
                //         const button = Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, i);
                //         if (button) {
                //             const frame = Frame.createSimple("commandButtonTooltip" + i, button, 0);
                //             if (frame) {
                //                 frame.setVisible(false);
                //                 frame.setText('YOLO'
                //                 )
                //                 button.setTooltip(frame);
                //                 // this.commandButtonTooltip[i] = frame;
                //             }
                //         }
                //         // const frame = Frame.createSimple('SIMPLEFRAME', button);
                //         // frame.setTooltip(button);
                //         // frame.setVisible(false);
                //         // CommandButtonTooltip.commandButtonTooltip[i] = frame;
                //     }
                // })
                //     TriggerRegisterGameEvent(udg_BuildTrigger[i], EVENT_GAME_BUILD_SUBMENU)
                //     const t = new Trigger();
                //     // t.registerAnyUnitEvent(EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER)
                //     t.registerPlayerEvent()
                //     t.registerAnyUnitEvent(EVENT_PLAYER_UNIT_SPELL_CAST)
                //     t.addAction(() => {
                //         print(DecodeFourCC(GetSpellAbilityId()))
                //         print(GetSpellAbility())
                //         print(GetSpellTargetX(), GetSpellTargetY())
                //
                //     })
                break;
            case 'diff':
                amount = Util.ParsePositiveInt(command[1]);
                if (!amount) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;

                }
                player.sendMessage(`Difficulty was set to ${amount}%`);
                this.game.diffVote.difficulty = amount;
                for (const enemy of this.game.enemies) {
                    enemy.handicap = amount;
                }
                break;
            case 'wave':
                amount = Util.ParsePositiveInt(command[1]);
                if (!amount) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;

                }
                if (amount > this.game.worldMap.waveCreeps.length) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;
                }
                player.sendMessage(`Current wave was set to ${amount}`);

                if (this.game.worldMap.gameRoundHandler) {
                    this.game.worldMap.gameRoundHandler.currentWave = amount;
                }
                break;
            case 'draw':
                const arr: Maze[] = this.game.worldMap.playerMazes;
                switch (command[1]) {
                    case 'ab':
                    case 'antiblock':
                        break;
                }
                for (let i: number = 0; i < command.length - 2; i++) {
                    if (!command[2 + i]) {
                        Log.Error('Missing arguments');
                        return;
                    }
                    if (!arr) {
                        Log.Error('invalid array');
                        return;
                    }

                    if (!arr[+command[2 + i]]) {
                        Log.Error('invalid index');
                        return;
                    }
                    this.DrawMaze(arr[+command[2 + i]]);

                }

                break;
            case 'undraw':

                this.DestroyDrawings();
                break;
            case 'point':
                this.drawPoint(player.builders[0]!);
                break;
            case 'bird':
                SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, 270, 1);
                break;
            case 'killall':
                const spawnedCreeps: SpawnedCreeps | undefined = this.game.worldMap.spawnedCreeps;
                if (spawnedCreeps !== undefined) {
                    spawnedCreeps.unitMap.forEach(u => u.unit.destroy());
                }
                break;
            case 'events':
                Log.Debug(`TickEvents: ${this.game.towerTicker.GetTickingTowerCount()}`);
                break;
            case 'timer':
                this.TestTimeout();
                break;
            case 'start':
            case 'startwave':
                this.game.waveTimer = 1;
                break;
            // case 'mmd':
            //     switch (command2[1]) {
            //         case 'define':
            //             switch (command2[2]) {
            //                 case 'string':
            //                     this.game.mmd.DefineValue(command2[3], MMDType.String, MMDGoal.None, MMDSuggest.Track);
            //                     break;
            //                 case 'number':
            //                     this.game.mmd.DefineValue(command2[3], MMDType.Number, MMDGoal.Low, MMDSuggest.Track);
            //                     break;
            //                 case 'event':
            //                     this.game.mmd.DefineEvent(command2[3], ...command2.slice(4));
            //                     break;
            //             }
            //             break;
            //         case 'update':
            //             switch (command2[2]) {
            //                 case 'string':
            //                     this.game.mmd.UpdateValueString(command2[3], player.wcPlayer, command2.slice(4).join(' '));
            //                     break;
            //                 case 'number':
            //                     this.game.mmd.UpdateValueNumber(command2[3], player.wcPlayer, MMDOperator.Set, +command2[4]);
            //                     break;
            //                 case 'event':
            //                     this.game.mmd.LogEvent(command2[3], ...command2.slice(4));
            //                     break;
            //             }
            //             break;
            //     }
            //     break;
            case 'leave':
                player.PlayerLeftTheGame();
                break;
            case 'spawn':
                const id: string = command2[1];
                if (id.length === 4) {
                    const u = Unit.create(
                        player, FourCC(id), BlzGetTriggerPlayerMouseX(), BlzGetTriggerPlayerMouseY(), bj_UNIT_FACING);
                    this.game.worldMap.towerConstruction.SetupTower(u!, player);
                }
                break;
            case 'tm':
                player.sendMessage(Util.ArraysToString(this.game.worldMap.playerMazes[player.id].maze));
                PreloadGenStart();
                this.MazeToString(this.game.worldMap.playerMazes[player.id].maze);

                PreloadGenEnd('testmap.txt');
                break;
            case 'sanity':
                this.game.worldMap.playerMazes[player.id].SanityCheck();
                this.game.worldMap.playerMazes[player.id].CheckAll();
                break;
            case 'time':
                amount = Util.ParsePositiveInt(command[1]);
                if (!amount) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;

                }
                this.game.waveTimer = amount;
                break;
        }
    }

    private handleCommand(): void {
        const player: Defender | undefined = this.game.players.get(GetPlayerId(GetTriggerPlayer()!));
        if (!player) {
            return;
        }
        if (GetEventPlayerChatString()!.substr(0, 1) !== '-') {
            // Log.Debug(GetEventPlayerChatString());
            Log.Event(0, `{"message":"${GetEventPlayerChatString()}", "sender": "${player.GetLogStr()}"}`);

            return;
        }

        const playerCommand: string = GetEventPlayerChatString()!.substr(1).toLowerCase();
        const playerCommand2: string = GetEventPlayerChatString()!.substr(1);
        const command: string[] = playerCommand.split(' ');
        const command2: string[] = playerCommand2.split(' ');


        Log.Event(4, `{"command":"${Util.ArraysToString(command)}", "sender": "${player.GetLogStr()}"}`);

        if (command[0] === 'air') {
            player.sendMessage('|cFF999999Air:|r 5 / 15 / 20 / 25 / 30');
        } else if (command[0] === 'boss') {
            player.sendMessage('|cFF3737F2Boss:|r 9 / 14 / 19 / 24 / 29 / 31');
        } else if ((command[0] === 'champ') || (command[0] === 'champion')) {
            player.sendMessage('|cFFF2A137Champion:|r 35 / 36');
        } else if (command[0] === 'light') {
            player.sendMessage('|cFF6d7c86Light:|r 4 / 8 / 11 / 16 / 19 / 23 / 27 / 32');
        } else if (command[0] === 'medium') {
            player.sendMessage('|cFF416073Medium:|r 3 / 7 / 12 / 17 / 24 / 28 / 33');
        } else if (command[0] === 'heavy') {
            player.sendMessage('|cFF154360Heavy:|r 2 / 5 / 13 / 15 / 20 / 25 / 30 / 32 / 35');
        } else if (command[0] === 'fortified') {
            player.sendMessage('|cFFCA8500Fortified:|r 10 / 18 / 22 / 26 / 31');
        } else if (command[0] === 'hero') {
            player.sendMessage('|cFF7525FFHero:|r 36');
        } else if (command[0] === 'waves') {
            player.sendMessage(
                `|cFF999999Air:|r 5 / 15 / 20 / 25 / 30
|cFF3737F2Boss:|r 9 / 14 / 19 / 24 / 29 / 31
|cFFF2A137Champion:|r 35 / 36
|cFF6d7c86Light:|r 4 / 8 / 11 / 16 / 19 / 23 / 27 / 32
|cFF416073Medium:|r 3 / 7 / 12 / 17 / 24 / 28 / 33
|cFF154360Heavy:|r 2 / 5 / 13 / 15 / 20 / 25 / 30 / 32 / 35
|cFFCA8500Fortified:|r 10 / 18 / 22 / 26 / 31
|cFF7525FFHero:|r 36`);
        } else if (command[0] === 'buffs') {
            player.sendMessage(
                '|cFFFFCC00Hardened Skin:|r Creeps ignore 2x creep level incoming physical damage\n' +
                '|cFFFFCC00Evasion:|r Creeps will have a 1x creep level chance to evade physical damage\n' +
                '|cFFFFCC00Armor Bonus:|r Increases creep armor by creep level divided by 3\n' +
                '|cFFFFCC00Cripple Aura:|r Whenever a creep takes damage it has a 10% chance to cripple the attacking tower,' +
                'slowing attack speed by 1.5% times creep level\n' +
                '|cFFFFCC00Spell Shield:|r Blocks targetting spells from casting every 4 (minus 0.1 times creep level) second\n' +
                '|cFFFFCC00Tornado Aura:|r Nearby towers are slowed by 1% times creep level\n' +
                '|cFFFFCC00Vampiric Aura:|r Creeps have a 10% chance to heal for 4x creep level\n' +
                '|cFFFFCC00Divine Shield:|r Creeps ignore damage until they\'ve been damaged 1x creep level times\n' +
                '|cFFFFCC00Walk it Off:|r slowed down creeps take 0.5% times creep level less damage\n' +
                '|cFFFFCC00Morning Person:|r creeps heal for 0.5% times creep level of their max health every time they ' +
                'reach a checkpoint (not teleports)');
        } else if (command[0] === 'repick') {
            if (this.RepickConditions(player)) {
                this.RepickActions(player);
            } else {
                DisplayTimedTextToPlayer(player.handle, 0, 0, 5, 'You can only repick before wave 1!');
            }
        } else if ((command[0] === 'sa') || (command[0] === 'sellall')) {
            // player.sendMessage('SellAll Is Disabled');
            //
            // Log.Debug('[command] sellall');
            // player.SellAll();
        } else if (command[0] === 'y' || command[0] === 'yes') {
            this.VoteYes(player);
        } else if (command[0] === 'kick' || command[0] === 'votekick') {
            if (command[1]) {
                const receiver: number = this.getPlayerIdFromColourName(command[1]);
                const receivingPlayer: Defender | undefined = this.game.players.get(receiver);
                if (receivingPlayer) {
                    this.VoteKick(player, receivingPlayer);
                } else {
                    player.sendMessage('Player not available');
                }
            }
        } else if (command[0] === 'give' || command[0] === 'send') {
            const receiver: number = this.getPlayerIdFromColourName(command[1]);
            const receivingPlayer: Defender | undefined = this.game.players.get(receiver);

            const amount: number = Util.ParsePositiveInt(command[2]);
            if (!amount) {
                player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                return;
            }
            this.giveGoldToPlayer(receivingPlayer, player, amount);
        } else if (command[0] === 'allow') {
            // AllowSpecificPlayer();
            if (command[1]) {
                const receiver: number = this.getPlayerIdFromColourName(command[1]);
                const receivingPlayer: Defender | undefined = this.game.players.get(receiver);
                if (receivingPlayer) {
                    player.AllowPlayer(receivingPlayer.id);
                } else {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Colour'));
                }
            }
        } else if (command[0] === 'deny') {
            // DenySpecificPlayer();
            if (command[1]) {
                const receiver: number = this.getPlayerIdFromColourName(command[1]);
                const receivingPlayer: Defender | undefined = this.game.players.get(receiver);
                if (receivingPlayer) {
                    player.DenyPlayer(receivingPlayer.id);
                    player.ClaimTowers();
                } else {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Colour'));
                }
            }
        } else if (command[0] === 'allowall') {
            // AllowAllPlayers();
            // for (let i: number = 0; i < 13; i++) {
            //     player.AllowPlayer(i);
            // }.
            player.AllowAllPlayers();
            player.sendMessage('ALL players are now |cFF00FF00allowed|r to build in your spawn!');
        } else if (command[0] === 'denyall') {
            // DenyAllPlayers();
            // for (let i: number = 0; i < 13; i++) {
            //     player.DenyPlayer(i);
            // }
            player.DenyAllPlayers();
            player.ClaimTowers();
            player.sendMessage('ALL players are now |cFFFF0000denied|r access to your spawn!');
        } else if (command[0] === 'claim') {
            player.ClaimTowers();
        } else if (command[0] === 'forceblitz') {
            if (player.isDeveloper) {
                this.game.diffVote.forceBlitz = true;
            }
        } else if (command[0] === 'zoom' || command[0] === 'cam') {
            if (GetLocalPlayer() === player.handle) {
                const amount: number = Util.ParsePositiveInt(command[1]);
                if (!amount) {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Amount'));
                    return;

                }
                SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, amount, 1);
            }
        } else if (command[0] === 'dt' || command[0] === 'disabletowers') {
            // player.DisableTowers();
            player.sendMessage('This command has been removed.');
        } else if (command[0] === 'buildings' || command[0] === 'towers') {
            if (command[1]) {
                const receiver: number = this.getPlayerIdFromColourName(command[1]);
                const receivingPlayer: Defender | undefined = this.game.players.get(receiver);
                if (receivingPlayer) {
                    if (receivingPlayer.hasHybridRandomed) {
                        for (const tower of receivingPlayer.hybridTowers) {
                            player.sendMessage(GetLocalizedString(tower.name) || '');
                        }
                    } else {
                        player.sendMessage(`${receivingPlayer.getNameWithColour()} has not hybrid randomed.`);

                    }
                } else {
                    player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Colour'));
                }
            } else {
                player.sendMessage('Wrong Usage: -buildings <colour>');
            }
        } else if (command[0] === 'maze') {
            let invalidMaze: boolean = false;
            if (command.length === 2) {
                const playerId = MapPlayer.fromEvent()?.id!;
                const firstSpawn: CheckPoint | undefined = this.game.worldMap.playerSpawns[playerId].spawnOne;
                if (firstSpawn === undefined) {
                    return;
                }

                const firstCheckpoint: CheckPoint | undefined = firstSpawn.next;
                if (firstCheckpoint === undefined) {
                    return;
                }

                const secondCheckpoint: CheckPoint | undefined = firstCheckpoint.next;
                if (secondCheckpoint === undefined) {
                    return;
                }

                let imagePath: string = '';
                // if (GetTriggerPlayer() === GetLocalPlayer()) {
                imagePath = 'ReplaceableTextures\\Splats\\SuggestedPlacementSplat.blp';
                // }

                switch (command[1]) {
                    case 'none':
                        player.setHoloMaze(undefined);
                        break;
                    case '1':
                        player.setHoloMaze(
                            new CircleHoloMaze(
                                imagePath,
                                GetRectCenterX(firstCheckpoint.rectangle),
                                GetRectCenterY(firstCheckpoint.rectangle),
                                GetRectCenterX(secondCheckpoint.rectangle),
                                GetRectCenterY(secondCheckpoint.rectangle)));
                        break;
                    case '2':
                        player.setHoloMaze(
                            new SimpleHoloMaze(
                                imagePath,
                                GetRectCenterX(firstCheckpoint.rectangle),
                                GetRectCenterY(firstCheckpoint.rectangle),
                                GetRectCenterX(secondCheckpoint.rectangle),
                                GetRectCenterY(secondCheckpoint.rectangle)));
                        break;
                    case '3':
                        player.setHoloMaze(
                            new AdvancedHoloMaze(
                                imagePath,
                                GetRectCenterX(firstCheckpoint.rectangle),
                                GetRectCenterY(firstCheckpoint.rectangle),
                                GetRectCenterX(secondCheckpoint.rectangle),
                                GetRectCenterY(secondCheckpoint.rectangle)));
                        break;
                    default:
                        invalidMaze = true;
                        break;
                }
            } else {
                invalidMaze = true;
            }

            if (invalidMaze === true) {
                player.sendMessage(
                    'Unknown maze selected, please try one of the mazes shown below\n' +
                    '|cFFFFCC00-maze none|r: removes the current maze\n' +
                    '|cFFFFCC00-maze 1|r: shows a very simple circled maze\n' +
                    '|cFFFFCC00-maze 2|r: shows a basic maze\n' +
                    '|cFFFFCC00-maze 3|r: shows a more advanced maze');
            }
        }
        if (this.game.debugMode) {
            this.handleDebugCommand(player, command, command2);
        }
    }

    public getPlayerIdFromColourName(color: string): number {
        return Util.COLOUR_IDS[color.toUpperCase()];
    }

    public RepickActions(player: Defender): void {
        const grp: group = GetUnitsInRectAll(GetPlayableMapRect()!)!;
        const maxGold: number = player.id === COLOUR.GRAY ? 150 : 100;
        if (player.getGold() > maxGold) {
            player.setGold(maxGold);
        }
        player.setLumber(1);
        ForGroupBJ(grp, () => this.RemovePlayerUnits(player));
        DestroyGroup(grp);
    }

    public RepickConditions(player: Defender): boolean {
        if (!(this.game.worldMap.gameRoundHandler && this.game.worldMap.gameRoundHandler.currentWave === 1)) {
            return false;
        }
        if (this.game.worldMap.gameRoundHandler && this.game.worldMap.gameRoundHandler.isWaveInProgress) {
            return false;
        }
        if (player.hasHardcoreRandomed) {
            return false;
        }
        if (player.hasHybridRandomed) {
            return false;
        }
        return true;
    }

    public RemovePlayerUnits(player: Defender): void {
        const unit = Unit.fromEnum();
        if (unit?.owner.id === player.id) {
            if (this.RepickRemoveConditions(unit)) {
                unit.destroy();
            }
        }
    }

    private RepickRemoveConditions(unit: Unit): boolean {
        if (unit.typeId === FourCC('h03S')) {
            return false;
        }

        if (unit.typeId === FourCC('e00C')) {
            return false;
        }

        return true;
    }

    public OpenAllSpawns(): void {
        for (const spawn of this.game.worldMap.playerSpawns) {
            spawn.isOpen = true;
        }
    }

    public CloseAllSpawns(): void {
        for (const spawn of this.game.worldMap.playerSpawns) {
            spawn.isOpen = false;
        }
    }

    private giveGoldToPlayer(receivingPlayer: Defender | undefined, player: Defender, amount: number): void {
        if (receivingPlayer) {
            if (player.getGold() >= amount) {
                player.setGold(player.getGold() - amount);
                receivingPlayer.setGold(receivingPlayer.getGold() + amount);
                player.sendMessage(
                    `You've sent ${Util.ColourString('#FFCC00', `${amount}`)} gold to ${receivingPlayer.getNameWithColour()}`);
                receivingPlayer.sendMessage(
                    `You've received ${Util.ColourString('#FFCC00', `${amount}`)} gold from ${player.getNameWithColour()}`);

            } else {
                player.sendMessage('You do not have this much gold');
            }
        } else {
            player.sendMessage(Util.ColourString(COLOUR_CODES[COLOUR.RED], 'Invalid Receiver'));
        }
    }

    private VoteKick(player: Defender, receivingPlayer: Defender): void {
        if (!this.voteKickInProgress) {
            if (player !== receivingPlayer) {
                SendMessage(
                    `${player.getNameWithColour()} has started a votekick for ${receivingPlayer.getNameWithColour()} (say -y to vote)`);
                this.voteKickInProgress = true;
                this.voteAgainstPlayer = receivingPlayer;
                this.hasVotedToKick[player.id] = true;
                this.game.timedEventQueue.AddEvent(new TimedEvent(() => this.VotekickExpire(), 300, false));

            } else {
                player.sendMessage('You idiot, you cannot stomp your own ass with the front of your own foot.');
                // this.game.timedEventQueue.AddEvent(new TimedEvent(() => this.VotekickExpire(), 30, false));
                // TimerStart(this.voteKickTimer, 30.00, false, () => this.VotekickExpire());
            }
        } else {
            player.sendMessage('There is already a votekick in progress');
        }

    }

    private VotekickExpire(): boolean {
        const count: number = this.CountCurrentVotes();
        if (this.voteAgainstPlayer) {
            SendMessage(`Votekick for ${this.voteAgainstPlayer.getNameWithColour()} has ended with ${count} votes`);
        }
        this.voteKickInProgress = false;
        return true;
    }

    private VoteYes(player: Defender): void {
        if (this.voteKickInProgress) {
            if (!this.hasVotedToKick[player.id]) {
                if (!(this.voteAgainstPlayer === player)) {
                    this.hasVotedToKick[player.id] = true;
                    this.CheckVotes();
                } else {
                    player.sendMessage('You can not kick yourself');

                }
            } else {
                player.sendMessage('You have already voted to kick this player');
            }
        } else {
            player.sendMessage('There is no votekick in progress');
        }
    }

    private CheckVotes(): void {
        const currentVotes: number = this.CountCurrentVotes();
        const neededVotes: number = (this.game.players.size / 2) + 1;
        const missingVotes: number = neededVotes - currentVotes;


        if (currentVotes >= neededVotes) {
            if (this.voteAgainstPlayer) {
                this.game.worldMap.playerSpawns[this.voteAgainstPlayer.id].isOpen = false;

                this.RemoveAllKickedPlayerTowers();
                if (this.game.scoreBoard) {
                    MultiboardSetItemValueBJ(this.game.scoreBoard.board, 1, 7 + this.voteAgainstPlayer.scoreSlot,
                        Util.ColourString(this.voteAgainstPlayer.getColourCode(), '<Kicked>'));
                }
                this.game.players.delete(this.voteAgainstPlayer.id);

                SendMessage(`Votekick for ${this.voteAgainstPlayer.getNameWithColour()} has succeeded!`);
                CustomDefeatBJ(this.voteAgainstPlayer.handle, 'Kicked!');

                // DestroyTimer(this.voteKickTimer);
                this.voteKickInProgress = false;
            }
        } else {
            SendMessage(`You'll need ${missingVotes} more votes to kick`);
        }
    }

    private CountCurrentVotes(): number {
        let count: number = 0;
        for (let i: number = 0; i < this.hasVotedToKick.length; i++) {
            if (this.hasVotedToKick[i]) {
                count++;
            }
        }
        return count;
    }

    private RemoveAllKickedPlayerTowers(): void {
        const grp: group = GetUnitsInRectAll(GetPlayableMapRect()!)!;
        ForGroupBJ(GetUnitsInRectAll(GetPlayableMapRect()!)!, () => this.RemoveKickedPlayerTowers());
        DestroyGroup(grp);
    }

    private RemoveKickedPlayerTowers(): void {
        if (this.IsPickedUnitOwnedByKickedPlayer()) {
            const unit = Unit.fromEnum();
            unit?.destroy();
        }
    }

    private IsPickedUnitOwnedByKickedPlayer(): boolean {
        if (!this.voteAgainstPlayer) {
            return false;
        }

        const unit = Unit.fromEnum();
        if (!(unit?.owner.id === this.voteAgainstPlayer.id)) {
            return false;
        }

        return unit.typeId !== FourCC('h03S');


    }

    private DrawRect(rectangle: Rectangle): void {
        const x1: number = rectangle.minX;
        const y1: number = rectangle.minY;
        const x2: number = rectangle.maxX;
        const y2: number = rectangle.maxY;

        const imagePath: string = 'ReplaceableTextures\\Splats\\SuggestedPlacementSplat.blp';


        const sfx: Image[] = [];
        for (let x: number = x1; x < x2; x = x + 16) {
            sfx.push(new Image(imagePath, 96, x, y1, 0.00));
        }

        for (let y: number = y1; y < y2; y = y + 16) {
            sfx.push(new Image(imagePath, 96, x2, y, 0.00));
        }

        for (let x: number = x1; x < x2; x = x + 16) {
            sfx.push(new Image(imagePath, 96, x, y2, 0.00));
        }
        for (let y: number = y1; y < y2; y = y + 16) {
            sfx.push(new Image(imagePath, 96, x1, y, 0.00));
        }
        this.drawings.push(sfx);
        sfx.forEach((img: Image) => {
            img.SetImageRenderAlways(true);
            img.ShowImage(true);
        });
    }

    private DrawMaze(maze: Maze): void {
        const x1: number = maze.minX;
        const y1: number = maze.minY;
        const x2: number = maze.maxX;
        const y2: number = maze.maxY;

        const imagePath: string = 'ReplaceableTextures\\Splats\\SuggestedPlacementSplat.blp';


        const sfx: Image[] = [];
        for (let x: number = x1; x < x2; x = x + 72) {
            sfx.push(new Image(imagePath, 96, x, y1, 0.00));
        }

        for (let y: number = y1; y < y2; y = y + 72) {
            sfx.push(new Image(imagePath, 96, x2, y, 0.00));
        }

        for (let x: number = x1; x < x2; x = x + 72) {
            sfx.push(new Image(imagePath, 96, x, y2, 0.00));
        }
        for (let y: number = y1; y < y2; y = y + 72) {
            sfx.push(new Image(imagePath, 96, x1, y, 0.00));
        }
        this.drawings.push(sfx);
        sfx.forEach((img: Image) => {
            img.SetImageRenderAlways(true);
            img.ShowImage(true);
        });
    }

    private drawPoint(builder: Unit): void {
        const x: number = Math.round(builder.x / 64) * 64;
        const y: number = Math.round(builder.y / 64) * 64;
        Log.Debug(`(${x}, ${y})`);

        const imagePath: string = 'ReplaceableTextures\\Splats\\SuggestedPlacementSplat.blp';


        const img: Image = new Image(imagePath, 96, x, y, 0.00);
        img.SetImageRenderAlways(true);
        img.ShowImage(true);

        this.points.push(img);
    }


    private DestroyDrawings(): void {
        for (const drawing of this.drawings) {
            for (const sfx of drawing) {
                sfx.Destroy();
            }
        }
        for (const sfx of this.points) {
            sfx.Destroy();
        }
        this.drawings = [];
        this.points = [];
    }

    //
    // private TestUi(): void {
    //     // const fh: framehandle = BlzCreateSimpleFrame('TestPanel', BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), 0);
    //     // // const fh: framehandle = BlzGetFrameByName('SimpleUnitStatsPanel', 0);
    //     // // BlzFrameClearAllPoints(fh);
    //     // BlzFrameSetSize(fh, 0.1, 0.1);
    //     //
    //     // BlzFrameSetAbsPoint(fh, FRAMEPOINT_CENTER, 0.4, 0.3);
    //     // Log.Debug(ToString(GetHandleId(fh)));
    //     // // BlzFrameSetPoint(fh, FRAMEPOINT_TOP, BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), FRAMEPOINT_TOP, 0, -0.3);
    //     // // Log.Debug(ToString(BlzFrameGetValue(fh)));
    //     // // BlzFrameSetAbsPoint(fh, FRAMEPOINT_TOP, 0.0, 0.1);
    //     // // BlzFrameSetValue(fh, 100);
    //     // // BlzFrameSetText(BlzGetFrameByName('MyBarText', 0), '');
    //     // // BlzFrameSetTexture(BlzGetFrameByName('MyBarBackground', 0), 'Replaceabletextures\\CommandButtons\\BTNHeroDeathKnight.blp', 0, true);
    //     // // BlzFrameSetTexture(fh, 'Replaceabletextures\\CommandButtons\\BTNArthas.blp', 0, false);
    //     // // BlzFrameSetSize(fh, 0.02, 0.02);
    //     // // TimerStart(CreateTimer(), 0.08, true, () => this.ChangeUI());
    // }
    //
    //
    // private ChangeUI(): void {
    //     const fh: framehandle = BlzGetFrameByName('MyBar', 0);
    //     BlzFrameSetValue(fh, BlzFrameGetValue(fh) + GetRandomReal(-3, 3));
    //
    // }
    private TestTimeout(): void {
        this.game.timedEventQueue.AddEvent(new TimedEvent(() => this.Timeout(), 20, false));
    }

    private Timeout(): boolean {
        Log.Debug('Hello world');
        return true;
    }

    private MazeToString(maze: Walkable[][]): void {
        let output: string = '[';
        Preload(`{"logevent":}`);
        for (let i: number = 0; i < maze.length; i++) {
            if (i === maze.length - 1) {
                Preload(`"${Util.ArraysToString(maze[i])}"`);
                continue;
            }
            Preload(`"${Util.ArraysToString(maze[i])}"`);
        }
    }
}
