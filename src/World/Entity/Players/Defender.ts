import {AbstractPlayer} from './AbstractPlayer';
import {Point} from '../../GlobalSettings';
import {Race} from '../../Game/Races/Race';
import {WarcraftMaul} from '../../WarcraftMaul';
import {AbstractHologramMaze} from '../../Holograms/AbstractHologramMaze';
import {Tower} from '../Tower/Specs/Tower';
import {CitadelOfNaxxramas} from '../Tower/Races/Naxxramas/CitadelOfNaxxramas';
import {Effect, Timer, Trigger, Unit} from "w3ts";
import {Rectangle} from "../../../JassOverrides/Rectangle";
import {COLOUR, DecodeFourCC, SendMessage, Util} from "../../../lib/translators";
import {Log} from "../../../lib/Serilog/Serilog";
import {TimedEvent} from "../../../lib/WCEventQueue/TimedEvent";
import {GameTowerDef} from "../../Game/Races/HybridRandom.types";
import {Maze, Walkable} from "../../Antiblock/Maze";
import {DummyTowers} from "../../Game/Races/HybridRandom";

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
    private mousePressTrigger: Trigger | undefined;
    private escapeTrigger: Trigger | undefined;
    /** Set from frame hover events so clicks on our UI are not treated as map clicks (local only) */
    public pointerOverUi: boolean = false;
    mouseX: number = 0;
    mouseY: number = 0;
    private _highlightedPoints: { x: number, y: number }[] = [];
    private _currentHighlightedMaze: number = -1;

    private _buildMode: boolean = false;
    private buildTier: number | undefined;
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

    get buildMode(): boolean {
        return this._buildMode;
    }

    /**
     * Enters build mode for one of the player's hybrid tiers: shows the maze grids and a ghost
     * of the tower. Runs on every client (from a sync message, chat or a key event), so the
     * handles it creates stay in step.
     */
    public startBuilding(tier: number): void {
        const tower: GameTowerDef | undefined = this.hybridTowers[tier];
        if (!tower || !this.hybridBuilder) {
            return;
        }
        this.stopBuilding();
        this._buildMode = true;
        this.buildTier = tier;
        for (const maze of this.game.worldMap.playerMazes) {
            maze.setBuildmode(this, true);
        }
        this.registerMouseTriggers();

        // The ghost is a local visual; other clients get an empty model at the same handle
        const center = this.highlightedCenter();
        this.buildEffect = Effect.create(this.isLocal() ? tower.model : '', center?.x ?? 0, center?.y ?? 0);
        if (this.buildEffect) {
            this.buildEffect.scale = tower.modelScale;
            this.buildEffect.setColor(128, 128, 128);
            this.buildEffect.setAlpha(153);
            this.buildEffect.setYaw(Deg2Rad(270));
            this.buildEffect.setTimeScale(0.01);
        }
    }

    public stopBuilding(): void {
        if (!this._buildMode) {
            return;
        }
        this._buildMode = false;
        this.buildTier = undefined;
        if (this.currentHighlightedMaze !== -1) {
            this.clearHighlightedPoints(this.game.worldMap.playerMazes[this.currentHighlightedMaze]);
        }
        for (const maze of this.game.worldMap.playerMazes) {
            maze.setBuildmode(this, false);
        }
        this.destroyMouseTriggers();
        this.discardGhost();
    }

    /**
     * DestroyEffect plays the model's death animation at the effect's time scale, and the ghost
     * is frozen at 0.01, so it would linger for minutes. Hide it completely before destroying.
     */
    private discardGhost(): void {
        if (!this.buildEffect) {
            return;
        }
        this.buildEffect.setTimeScale(1);
        this.buildEffect.scale = 0;
        this.buildEffect.setAlpha(0);
        this.buildEffect.destroy();
        this.buildEffect = undefined;
    }

    /**
     * Mouse events are sent over the network for every registered player, so they are only
     * registered while the player is placing towers.
     */
    private registerMouseTriggers(): void {
        this.mouseMoveTrigger = Trigger.create();
        this.mouseMoveTrigger.registerPlayerMouseEvent(this, bj_MOUSEEVENTTYPE_MOVE);
        this.mouseMoveTrigger.addAction(() => this.mouseMoved());
        this.mousePressTrigger = Trigger.create();
        this.mousePressTrigger.registerPlayerMouseEvent(this, bj_MOUSEEVENTTYPE_DOWN);
        this.mousePressTrigger.addAction(() => this.mousePressed());
    }

    private destroyMouseTriggers(): void {
        this.mouseMoveTrigger?.destroy();
        this.mousePressTrigger?.destroy();
        this.mouseMoveTrigger = undefined;
        this.mousePressTrigger = undefined;
    }

    /**
     * Decides on this player's own client whether a click places a tower. The pointer being
     * over the UI and the highlighted cells are local knowledge, so the decision is sent as a
     * sync message and placeTower runs everywhere with the same input.
     */
    private requestTowerPlacement(): void {
        if (!this.isLocal() || this.pointerOverUi || this.buildTier === undefined) {
            return;
        }
        if (this.currentHighlightedMaze === -1 || this.highlightedPoints.length !== 4) {
            this.sendMessage('The tower does not fit there');
            return;
        }
        const maze = this.game.worldMap.playerMazes[this.currentHighlightedMaze];
        if (this.highlightedPoints.some(point => maze.getWalkable(point.x, point.y) !== Walkable.Walkable)) {
            this.sendMessage('You cannot build there');
            return;
        }
        const cornerX = Math.min(...this.highlightedPoints.map(point => point.x));
        const cornerY = Math.min(...this.highlightedPoints.map(point => point.y));
        // Holding shift keeps build mode for the next tower, like the native build command
        const keepBuilding = BlzIsMetaKeyPressed(METAKEY_SHIFT) ? 1 : 0;
        // Build mode is local, so buildTier only exists on this client; carry it in the message
        this.game.playerSync.send('build',
            `${this.currentHighlightedMaze}:${cornerX}:${cornerY}:${this.buildTier}:${keepBuilding}`);
    }

    /** Applies a placement sent by requestTowerPlacement; runs on every client. */
    public placeTower(data: string): void {
        const [mazeIndex, cornerX, cornerY, tier, keepBuilding] = data.split(':').map(value => Number(value));
        const maze = this.game.worldMap.playerMazes[mazeIndex];
        // Build mode is local, so this runs on all clients from the tier in the message, not local state
        if (!this.hybridBuilder || !maze || !this.hybridTowers[tier]) {
            return;
        }
        const points = [
            {x: cornerX, y: cornerY}, {x: cornerX + 1, y: cornerY},
            {x: cornerX, y: cornerY + 1}, {x: cornerX + 1, y: cornerY + 1},
        ];
        if (points.some(point => point.x < 0 || point.x >= maze.width || point.y < 0 || point.y >= maze.height
            || maze.getWalkable(point.x, point.y) !== Walkable.Walkable)) {
            return;
        }
        const footprint = maze.getHighlightedPointsCenter(points)!;
        if (this.game.worldMap.playerSpawns[mazeIndex].overlapsCheckpoint(
            footprint.x - 64, footprint.y - 64, footprint.x + 64, footprint.y + 64)) {
            this.sendMessage('You cannot build on a checkpoint');
            return;
        }
        const tower = this.hybridTowers[tier];
        if (this.getGold() < tower.goldCost) {
            this.sendMessage(`Not enough gold, ${tower.name} costs |cffffcc00${tower.goldCost}|r`);
            return;
        }
        const center = maze.getHighlightedPointsCenter(points)!;
        const dummyId = DummyTowers[`${this.id + 1}`][`${tier + 1}`];
        if (!this.hybridBuilder.issueBuildOrder(FourCC(dummyId), center.x, center.y)) {
            this.sendMessage('The builder could not start building there');
            return;
        }
        // Explicit compare: 0 is truthy in the generated Lua, so !keepBuilding would never fire
        if (keepBuilding !== 1) {
            this.game.hybridBuildPanel.close(this);
        }
    }

    private highlightedCenter(): { x: number, y: number } | undefined {
        if (this.currentHighlightedMaze === -1) {
            return undefined;
        }
        return this.game.worldMap.playerMazes[this.currentHighlightedMaze].getHighlightedPointsCenter(this.highlightedPoints);
    }

    public clearHighlightedPoints(maze: Maze): void {
        // Reset previously highlighted points to their original colours
        for (const point of this._highlightedPoints) {
            if (this.isLocal()) {
                maze.gridPoints[point.x][point.y].colour = maze.gridColour(point.x, point.y);
            }
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
    // The lane (area, spawn, last-defender bonus) this player defends: their colour's lane
    // unless they took over the gray lane, see LaneTransfer
    private _lane: number;

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
        this._lane = id;
        game.laneHolders.set(id, this);
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
            this.escapeTrigger = Trigger.create();
            this.escapeTrigger.registerPlayerKeyEvent(this, OSKEY_ESCAPE, 0, true);
            this.escapeTrigger.addAction(() => this.game.hybridBuildPanel.close(this));
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


    private mousePressed(): void {
        const button = BlzGetTriggerPlayerMouseButton();
        this.mouseMoved();
        if (button === MOUSE_BUTTON_TYPE_RIGHT) {
            this.stopBuilding();
        } else if (button === MOUSE_BUTTON_TYPE_LEFT) {
            this.requestTowerPlacement();
        }
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


    get lane(): number {
        return this._lane;
    }

    /** Takes over another lane; the towers and builders are carried over by LaneTransfer. */
    public moveToLane(lane: number): void {
        this.game.laneHolders.delete(this._lane);
        this._lane = lane;
        this.game.laneHolders.set(lane, this);
        this.setHoloMaze(undefined);
        const location: Point = this.game.mapSettings.ALLOW_PLAYER_TOWER_LOCATIONS[lane];
        if (this.allowPlayerTower) {
            this.allowPlayerTower.x = location.x;
            this.allowPlayerTower.y = location.y;
        }
    }

    public getArea(): Rectangle {
        return this.game.mapSettings.PLAYER_AREAS[this.lane];
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
        this.game.worldMap.playerSpawns[this.lane].isOpen = false;
        this.game.laneHolders.delete(this.lane);
        if (this.game.scoreBoard && this._scoreSlot > -1) {

            MultiboardSetItemValueBJ(
                this.game.scoreBoard.board, 1, 7 + this._scoreSlot,
                Util.ColourString(this.getColourCode(), '<Quit>'));
            this._scoreSlot = -1;
        }
        for (const builder of this.builders) {
            builder.destroy();
        }

        this.stopBuilding();
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
        const center = this.highlightedCenter();
        if (this.buildEffect && center) {
            this.buildEffect.setPosition(center.x, center.y, 0);
        }
    }
}
