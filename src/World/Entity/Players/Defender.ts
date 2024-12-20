import {AbstractPlayer} from './AbstractPlayer';
import {Point} from '../../GlobalSettings';
import {Race} from '../../Game/Races/Race';
import {WarcraftMaul} from '../../WarcraftMaul';
import {AbstractHologramMaze} from '../../Holograms/AbstractHologramMaze';
import {Tower} from '../Tower/Specs/Tower';
import {CitadelOfNaxxramas} from '../Tower/Races/Naxxramas/CitadelOfNaxxramas';
import {Effect, Timer, Trigger, Unit} from "w3ts";
import {Rectangle} from "../../../JassOverrides/Rectangle";
import {COLOUR, SendMessage, Util} from "../../../lib/translators";
import {TimedEvent} from "../../../lib/WCEventQueue/TimedEvent";
import {GameTowerDef} from "../../Game/Races/HybridRandom.types";
import {Maze, Walkable} from "../../Antiblock/Maze";
import {HybridTierOne} from "../../Game/Races/HybridRandom";

export class Defender extends AbstractPlayer {

    public metadata: Record<string, any> = {};
    public chimeraCount: number = 0;
    public zerglings: number = 0;
    // private towerKeys: IterableIterator<number> | undefined = undefined;
    private loggedDebug: boolean = false;
    public seaElemetals: number = 0;
    public killHook?: () => void;
    public goldReward: number = 0;
    public citadelOfNaxxramas: CitadelOfNaxxramas | undefined;


    private mouseMoveTrigger: Trigger | undefined;
    private mousePressDownTrigger: Trigger | undefined;
    private mouseReleaseTrigger: Trigger | undefined;
    leftMouse: boolean = false;
    mouseX: number = 0;
    mouseY: number = 0;
    private _highlightedPoints: { x: number, y: number }[] = [];
    private _currentHighlightedMaze: number = -1;

    private _buildMode: boolean = false;
    private toBuild: GameTowerDef | undefined;
    private buildEffect: Effect | undefined;

    get highlightedPoints(): { x: number, y: number }[] {
        return this._highlightedPoints;
    }

    set highlightedPoints(value: { x: number, y: number }[]) {
        this._highlightedPoints = value;
    }


    get currentHighlightedMaze(): number {
        return this._currentHighlightedMaze;
    }

    set currentHighlightedMaze(value: number) {
        this._currentHighlightedMaze = value;
    }

    setBuildMode(buildMode: boolean, hybridTower?: GameTowerDef) {
        const playerMazes = this.game.worldMap.playerMazes;

        if (buildMode !== this._buildMode) {
            for (let i = 0; i < playerMazes.length; i++) {
                playerMazes[i].setBuildmode(this, buildMode)
            }

            if(buildMode) {
                this.toBuild =hybridTower || HybridTierOne[1];
                let effectModel = "";
                if (this.isLocal()) {
                    effectModel = this.toBuild.model;
                }
                const currentHighlightedMaze = this.currentHighlightedMaze;
                const maze = currentHighlightedMaze !== -1 && playerMazes[currentHighlightedMaze];
                let x = 0;
                let y = 0;

                if (maze && this.highlightedPoints) {
                    const center = maze.getHighlightedPointsCenter(this.highlightedPoints)
                    if (center) {
                        x = center.x;
                        y = center.y;
                    }
                    // Use center.x and center.y which will be in world coordinates
                }
                this.buildEffect = Effect.create(effectModel, x, y);
                this.buildEffect?.setColor(128, 128, 128);
                this.buildEffect?.setAlpha(153);
                this.buildEffect?.setYaw(Deg2Rad(270));
                this.buildEffect?.setTimeScale(0.01);
            } else {
                this.buildEffect?.destroy();
            }
        }
        this._buildMode = buildMode;
    }

    get buildMode() {
        return this._buildMode;
    }

    public clearHighlightedPoints(maze: Maze): void {
        // Reset previously highlighted points to their original colors
        for (const point of this._highlightedPoints) {
            let col = maze.gridPoints[point.x][point.y].colour;
            if (this.isLocal()) {
                if (maze.maze[point.x][point.y] === Walkable.Walkable) {
                    col = {red: 0, green: 0, blue: 255, alpha: 153}; // Blue
                } else {
                    col = {red: 255, green: 0, blue: 0, alpha: 153}; // Red
                }
            }
            maze.gridPoints[point.x][point.y].colour = col;

        }
        this._highlightedPoints = [];
        this._currentHighlightedMaze = -1;
    }


    private _voidFragments: number = 0;
    private _voidFragmentTick: number = 0;


    private _scoreSlot: number = 0;
    private _kills: number = 0;
    public allowPlayerTower: Unit | undefined;
    private _hasHybridRandomed: boolean = false;
    private _hasHardcoreRandomed: boolean = false;
    private _hasNormalPicked: boolean = false;
    private _races: Race[] = [];
    private _totalMazeLength: number = 0;
    private towersEnabled: boolean = true;

    private _repickCounter: number = 0;
    private _voidBuilder: Unit | undefined;
    private _lootBoxer: Unit | undefined;
    private _hybridBuilder: Unit | undefined;
    private _hybridTowers: GameTowerDef[] = [];
    private leaveTrigger: Trigger;
    private selectUnitTrigger: Trigger;
    private deniedPlayers: Map<number, boolean> = new Map<number, boolean>();
    private _towers: Map<number, Tower> = new Map<number, Tower>();
    private _towersArray: Tower[] = [];
    private _holoMaze: AbstractHologramMaze | undefined = undefined;
    private game: WarcraftMaul;
    private _builders: Unit[] = [];

    private _towerForces: Map<number, number> = new Map<number, number>();

    private protectedTowers: number[] = [ // towers that cant be disabled
        FourCC('n01D'), // [High Elven Farm] - High Elven Farm
        FourCC('n01E'), // [High Elven Farm] - Hungry Sheep
        FourCC('n01F'), // [High Elven Farm] - Hungry Albatross
        FourCC('n01G'), // [High Elven Farm] - Hungry Seal
        FourCC('n01I'), // [High Elven Farm] - Hungry Crab
        FourCC('n009'), // [Corrupt N.Elves] - Corrupted Moon Well
    ];


    constructor(id: number, game: WarcraftMaul) {
        super(id);
        this.game = game;
        this.setUpPlayerVariables();
        this.leaveTrigger = Trigger.create();
        TriggerRegisterPlayerEventLeave
        this.leaveTrigger.registerPlayerEvent(this, EVENT_PLAYER_LEAVE);
        this.leaveTrigger.addCondition(() => this.PlayerLeftTheGameConditions(game));
        this.leaveTrigger.addAction(() => this.PlayerLeftTheGame());

        this.selectUnitTrigger = Trigger.create();
        this.selectUnitTrigger.registerPlayerUnitEvent(this, EVENT_PLAYER_UNIT_SELECTED, undefined);
        this.selectUnitTrigger.addAction(() => this.SelectUnit());

        const t = new Timer().start(0.1, false, () => {
            t.destroy();
            this.mouseMoveTrigger = Trigger.create();
            this.mouseMoveTrigger.registerPlayerMouseEvent(this, bj_MOUSEEVENTTYPE_MOVE)
            this.mouseMoveTrigger.addAction(() => this.mouseMoved())
            this.mousePressDownTrigger = Trigger.create();
            this.mouseReleaseTrigger = Trigger.create();
            this.mousePressDownTrigger.registerPlayerMouseEvent(this, bj_MOUSEEVENTTYPE_DOWN)
            this.mouseReleaseTrigger.registerPlayerMouseEvent(this, bj_MOUSEEVENTTYPE_UP)
            this.mousePressDownTrigger.addAction(() => this.mousePressed(true))
            this.mouseReleaseTrigger.addAction(() => this.mousePressed(false))

        });


        this.game.gameCommandHandler.commandTrigger.registerPlayerChatEvent(this, '', false);
    }


    private mouseMoved() {
        this.mouseX = BlzGetTriggerPlayerMouseX();
        this.mouseY = BlzGetTriggerPlayerMouseY();
        // TODO: should mouse "reaction" be here?

        // Check if mouse is in any maze
        const playerMazes = this.game.worldMap.playerMazes;
        let foundMaze = false;
        for (let i = 0; i < playerMazes.length; i++) {
            const maze = playerMazes[i];
            if (maze.isPointInMaze(this.mouseX, this.mouseY)) {
                foundMaze = true;
                // If we were in a different maze before, clear those highlights
                if (this.currentHighlightedMaze !== i && this.currentHighlightedMaze !== -1) {
                    const oldMaze = playerMazes[this.currentHighlightedMaze];
                    this.clearHighlightedPoints(oldMaze);
                }
                // Update current maze and highlight new points
                this.currentHighlightedMaze = i;
                maze.highlightGridPoints(this.mouseX, this.mouseY, this);
                break; // Only highlight the first maze we're in
            }
        }

        // If we're not in any maze, clear highlights from the last maze we were in
        if (!foundMaze && this.currentHighlightedMaze !== -1) {
            const oldMaze = playerMazes[this.currentHighlightedMaze];
            this.clearHighlightedPoints(oldMaze);
        }

    }


    private mousePressed(pressed: boolean) {
        const button = BlzGetTriggerPlayerMouseButton();
        if (button == MOUSE_BUTTON_TYPE_LEFT) {
            this.leftMouse = pressed;
            // TODO:  Could check past state here, and fire event?
            // this.currentWeapon.fire();
        }
        this.mouseMoved();

        // if (button == MOUSE_BUTTON_TYPE_LEFT) {
        //     this.pressedButtons[MouseKey.LEFT] = pressed;
        // }
        // if (button == MOUSE_BUTTON_TYPE_RIGHT) {
        //     this.pressedButtons[MouseKey.RIGHT] = pressed;
        // }
    }

    public setHoloMaze(holoMaze: AbstractHologramMaze | undefined): void {
        if (this._holoMaze !== undefined) {
            this._holoMaze.Destroy();
        }

        this._holoMaze = holoMaze;
    }

    get holoMaze(): AbstractHologramMaze | undefined {
        return this._holoMaze;
    }


    get towerForces(): Map<number, number> {
        return this._towerForces;
    }

    get builders(): Unit[] {
        return this._builders;
    }

    set builders(value: Unit[]) {
        this._builders = value;
    }

    private setUpPlayerVariables(): void {
        // Remove fog
        CreateFogModifierRectBJ(true, this.handle, FOG_OF_WAR_VISIBLE, GetPlayableMapRect()!);


        // Set Starting gold and lumber
        this.setGold(this.id === COLOUR.GRAY ? 150 : 100)
        this.setLumber(1)


        // Create the allow player indicator tower
        const allowTowerLoc: Point = this.game.mapSettings.ALLOW_PLAYER_TOWER_LOCATIONS[this.id];
        //
        this.allowPlayerTower = Unit.create(this, FourCC('h03S'), allowTowerLoc.x, allowTowerLoc.y, 0.000);
        this.allowPlayerTower?.setVertexColor(0, 255, 0, 255)

    }

    public hasRace(race: Race): boolean {
        return this._races.indexOf(race) !== -1;
    }


    public getArea(): Rectangle {
        return this.game.mapSettings.PLAYER_AREAS[this.id];
    }

    public getCenterX(): number {
        const x1: number = this.getArea().minX;
        const x2: number = this.getArea().maxX;

        return (x1 + x2) / 2;
    }

    public getCenterY(): number {
        const y1: number = this.getArea().minY;
        const y2: number = this.getArea().maxY;

        return (y1 + y2) / 2;
    }

    public getVoidBuilder(): Unit | undefined {
        return this._voidBuilder;
    }

    public getLootBoxer(): Unit | undefined {
        return this._lootBoxer;
    }


    public getRectangle(): Rectangle {
        return this.getArea();
    }

    private PlayerLeftTheGameConditions(game: WarcraftMaul): boolean {
        if (game.gameLives > 0) {
            return true;
        }
        SendMessage(`${this.getNameWithColour()} has left the game!`);
        return false;
    }

    public PlayerLeftTheGame(): void {

        SendMessage(`${this.getNameWithColour()} has left the game!`);

        // TriggerSleepAction(2.00);
        this.game.worldMap.playerSpawns[this.id].isOpen = false;
        if (this.game.scoreBoard && this._scoreSlot > -1) {

            MultiboardSetItemValueBJ(
                this.game.scoreBoard.board, 1, 7 + this._scoreSlot,
                Util.ColourString(this.getColourCode(), '<Quit>'));
            this._scoreSlot = -1;
        }
        for (const builder of this.builders) {
            builder.destroy();
        }

        if (this.hybridBuilder) {
            this.hybridBuilder.destroy();
        }
        const leaveFunction: TimedEvent = new TimedEvent(() => this.AfterPlayerLeft(), 20);
        this.game.timedEventQueue.AddEvent(leaveFunction);

    }

    private AfterPlayerLeft(): boolean {
        this.game.safeEventQueue.AddMed(() => this.DistributeAndDestroyTowers());
        this.setHoloMaze(undefined);
        return true;
    }


    public AddTower(tower: Tower): void {
        this._towersArray.push(tower);
    }

    public GiveKillCount(): void {
        this._kills++;
        if (this.game.scoreBoard) {
            MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 7 + this._scoreSlot, `${this._kills}`);
        }
        if (this.killHook) {
            this.killHook();
        }
    }

    /**
     * Getters and Setters
     */
    get totalMazeLength(): number {
        return this._totalMazeLength;
    }

    set totalMazeLength(value: number) {
        this._totalMazeLength = value;
    }

    public GetTower(id: number): Tower | undefined {
        const indx: number = this._towersArray.findIndex((element) => element.UniqueID === id);
        if (indx >= 0) {
            return this._towersArray[indx];
        }
        return undefined;
    }

    get hybridTowers(): GameTowerDef[] {
        return this._hybridTowers;
    }

    set hybridTowers(value: GameTowerDef[]) {
        this._hybridTowers = value;
    }

    get hasHardcoreRandomed(): boolean {
        return this._hasHardcoreRandomed;
    }

    set hasHardcoreRandomed(value: boolean) {
        this._hasHardcoreRandomed = value;
    }

    get hasNormalPicked(): boolean {
        return this._hasNormalPicked;
    }

    set hasNormalPicked(value: boolean) {
        this._hasNormalPicked = value;
    }

    get races(): Race[] {
        return this._races;
    }

    get towersArray(): Tower[] {
        return this._towersArray;
    }

    set races(value: Race[]) {
        this._races = value;
    }

    get hybridBuilder(): Unit | undefined {
        return this._hybridBuilder;
    }

    set hybridBuilder(value: Unit | undefined) {
        this._hybridBuilder = value;
    }

    get hasHybridRandomed(): boolean {
        return this._hasHybridRandomed;
    }

    set hasHybridRandomed(value: boolean) {
        this._hasHybridRandomed = value;
    }

    get lootBoxer(): Unit | undefined {
        return this._lootBoxer;
    }

    set lootBoxer(value: Unit | undefined) {
        this._lootBoxer = value;
    }

    get voidBuilder(): Unit | undefined {
        return this._voidBuilder;
    }

    set voidBuilder(value: Unit | undefined) {
        this._voidBuilder = value;
    }

    get repickCounter(): number {
        return this._repickCounter;
    }

    set repickCounter(value: number) {
        this._repickCounter = value;
    }

    get kills(): number {
        return this._kills;
    }

    set kills(value: number) {
        this._kills = value;
    }

    get scoreSlot(): number {
        return this._scoreSlot;
    }

    set scoreSlot(value: number) {
        this._scoreSlot = value;
    }

    private DistributePlayerGold(): void {
        const leavingPlayerGold: number = this.getGold();
        let goldDistribution: number = leavingPlayerGold / (this.game.players.size - 1);

        goldDistribution = Math.floor(goldDistribution * 0.3);

        for (const player of this.game.players.values()) {
            player.sendMessage(`You have received |cffffcc00${goldDistribution}|r gold from the leaving player!`);
            player.giveGold(goldDistribution);
        }
    }


    private DistributeAndDestroyTowers(): boolean {
        if (this._towersArray.length > 0) {
            const tower: Tower | undefined = this._towersArray[0];
            if (tower !== undefined) {
                this.game.sellTower.SellTower(tower.unit);
                return false;
            }

        }

        this.DistributePlayerGold();
        this.setGold(0);
        this.game.players.delete(this.id);

        return true;

    }

    public ClaimTowers(): void {
        const rectangle: rect = this.getRectangle().toRect();
        const grp = GetUnitsInRectMatching(rectangle, Condition(() => this.IsOwnerNotMe()))!;
        ForGroupBJ(grp, () => this.ClaimTower());
        RemoveRect(rectangle);
        DestroyGroup(grp);
        this.sendMessage('All towers in your spawn has now been claimed.');

    }


    private ClaimTower(): void {
        const unit = Unit.fromEnum();
        if (unit?.isUnitType(UNIT_TYPE_STRUCTURE)) {
            const owner: Defender | undefined = this.game.players.get(unit!.owner.id);
            if (owner) {
                const tower: Tower | undefined = owner.GetTower(unit?.id);
                if (tower) {
                    tower.Sell();
                    tower.SetOwnership(this);
                }
            }
        } else if (unit && !unit.isUnitType(UNIT_TYPE_SUMMONED)) {
            const owner: Defender | undefined = this.game.players.get(unit!.owner.id);
            if (owner && owner !== this) {
                unit.setPosition(owner.getCenterX(), owner.getCenterY())
            }
        }
    }


    public DisableTowers(): void {
        this.towersEnabled = !this.towersEnabled;

        this.towersArray.forEach((tower) => {
            if (tower.GetSellValue() <= 10 && !(this.protectedTowers.indexOf(tower.GetTypeID()) >= 0)) {
                tower.unit.paused = !this.towersEnabled;
            }
        });

        if (this.towersEnabled) {
            this.sendMessage('Towers enabled');
        } else {
            this.sendMessage('Towers disabled');
        }

    }

    public isTowerDisableable(tower: Tower): boolean {
        return tower.GetSellValue() <= 10 && !(this.protectedTowers.indexOf(tower.GetTypeID()) >= 0);
    }


    public GetVoidFragments(): number {
        return this._voidFragments;
    }

    public GetVoidFragmentTick(): number {
        return this._voidFragmentTick;
    }

    public SetVoidFragments(value: number): void {
        this._voidFragments = value;
    }

    public SetVoidFragmentTick(value: number): void {
        this._voidFragmentTick = value;
    }

    public HasDenied(num: number): boolean {
        return !!this.deniedPlayers.get(num);
    }

    private ReRenderAllowPlayersTower(): void {


        let red: number = 0;
        let green: number = 255;
        const allowTower = this.allowPlayerTower;
        if (allowTower) {
            this.deniedPlayers.forEach((value: boolean, key: number) => {
                if (value) {
                    if (GetLocalPlayer() === Player(key)) { // ASK BEFORE EVER USING GetLocalPlayer()
                        red = 255;
                        green = 0;
                    }
                }
            });
            allowTower.setVertexColor(red, green, 0, 255)

        }
    }

    public DenyAllPlayers(): void {
        this.game.players.forEach((player) => {
            if (this.id !== player.id) {
                this.deniedPlayers.set(player.id, true);
            }
        });
        this.ReRenderAllowPlayersTower();
    }

    public DenyPlayer(num: number): void {
        this.deniedPlayers.set(num, true);
        this.ReRenderAllowPlayersTower();

    }

    public AllowAllPlayers(): void {
        this.game.players.forEach((player) => {
            if (this.id !== player.id) {
                this.deniedPlayers.set(player.id, false);
            }
        });
        this.ReRenderAllowPlayersTower();

        // this.deniedPlayers.set(num, false);
    }

    public AllowPlayer(num: number): void {
        this.deniedPlayers.set(num, false);
        this.ReRenderAllowPlayersTower();

    }

    // private DestroyLeftoverUnits(): void {
    //     if (GetOwningPlayer(GetEnumUnit()) === GetTriggerPlayer()) {
    //         RemoveUnit(GetEnumUnit());
    //
    //     }
    // }

    public GetLogStr(): string {
        return `{"colour":${this.id}, "name": "${this.getPlayerName()}"}`;
    }

    private IsOwnerNotMe(): boolean {
        const unit = Unit.fromHandle(GetFilterUnit())
        return unit?.owner.id !== this.id;

    }

    public RemoveTower(handleId: number): void {
        this._towersArray = this._towersArray.filter((elem) => elem.UniqueID !== handleId);
    }

    private SelectUnit(): void {
        const unit = Unit.fromEvent();
        if (unit?.owner.id === this.id) {
            unit.paused = false;
        }
    }

    updateBuildEffect() {
        if(!this.buildEffect) {
            return;
        }
        const playerMazes = this.game.worldMap.playerMazes;

        const currentHighlightedMaze = this.currentHighlightedMaze;
        const maze = playerMazes[currentHighlightedMaze];
        let x = 0;
        let y = 0;

        if (maze !== undefined && this.highlightedPoints.length > 0) {
            const center = maze.getHighlightedPointsCenter(this.highlightedPoints)
            if (center) {
                x = center.x;
                y = center.y;
            }
            // Use center.x and center.y which will be in world coordinates
        }
        this.buildEffect.setPosition(x,y,0);

    }
}
