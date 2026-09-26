import {Defender} from '../Players/Defender';
import * as settings from '../../GlobalSettings';
import {Log} from '../../../lib/Serilog/Serilog';
import {Tower} from './Specs/Tower';
import {WarcraftMaul} from '../../WarcraftMaul';
import {GenericAutoAttackTower} from './Specs/GenericAutoAttackTower';
import {LootBoxerHandler} from './Races/LootBoxer/LootBoxerHandler';
import {KillingActionTower} from './Specs/KillingActionTower';
import {TowerMap} from './Specs/TowerMap';
import {RaceTowers} from './Races/RaceTowers';
import {InitialiseAllRaceTowers} from './Races/RaceInitialiser';
import {Trigger, Unit} from "w3ts";
import {COLOUR, DecodeFourCC, ReplaceUnit} from "../../../lib/translators";
import {DummyTowersMap} from "../../Game/Races/HybridRandom";
import {Walkable} from "../../Antiblock/Maze";
import {SyncTrace} from '../../../lib/SyncTrace';

export class TowerConstruction {
    private races: RaceTowers[] = [];

    get towerTypes(): TowerMap<number, object> {
        return this._towerTypes;
    }

    private towerConstructTrigger: Trigger;
    private towerStartConstructTrigger: Trigger;
    private towerUpgradeTrigger: Trigger;
    private readonly _towerTypes: TowerMap<number, object>;
    public genericAttacks: Map<number, GenericAutoAttackTower> = new Map<number, GenericAutoAttackTower>();
    public killingActions: Map<number, KillingActionTower> = new Map<number, KillingActionTower>();
    private genericAttackTrigger: Trigger;
    private killingActionsTrigger: Trigger;
    private readonly game: WarcraftMaul;
    private lootBoxerHander: LootBoxerHandler;
    public lootBoxerTowers: number[] = [
        FourCC('u044'), // Tier 1
        FourCC('u045'), // Tier 2
        FourCC('u047'), // Tier 3
        FourCC('u046'), // Tier 4
        FourCC('u048'), // Tier 5
        FourCC('u049'), // Tier 6
        FourCC('u04A'), // Tier 7
        FourCC('u04B'), // Tier 8
        FourCC('u04C'), // Tier 9
    ];

    constructor(game: WarcraftMaul) {
        this.game = game;
        this._towerTypes = InitialiseAllRaceTowers();
        this.lootBoxerHander = new LootBoxerHandler(this, game);
        this.towerStartConstructTrigger = Trigger.create();
        this.towerStartConstructTrigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_CONSTRUCT_START);
        this.towerStartConstructTrigger.addAction(() => this.ConstructionStarted());

        this.towerConstructTrigger = Trigger.create();
        this.towerConstructTrigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_CONSTRUCT_FINISH);
        this.towerConstructTrigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_UPGRADE_FINISH);
        this.towerConstructTrigger.addAction(() => this.ConstructionFinished());

        this.towerUpgradeTrigger = Trigger.create();
        this.towerUpgradeTrigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_UPGRADE_FINISH);
        this.towerUpgradeTrigger.addAction(() => this.UpgradeTower());


        this.genericAttackTrigger = Trigger.create();
        TriggerRegisterPlayerUnitEventSimple(this.genericAttackTrigger.handle, Player(COLOUR.NAVY)!, EVENT_PLAYER_UNIT_ATTACKED);
        TriggerRegisterPlayerUnitEventSimple(this.genericAttackTrigger.handle, Player(COLOUR.TURQUOISE)!, EVENT_PLAYER_UNIT_ATTACKED);
        TriggerRegisterPlayerUnitEventSimple(this.genericAttackTrigger.handle, Player(COLOUR.VOILET)!, EVENT_PLAYER_UNIT_ATTACKED);
        TriggerRegisterPlayerUnitEventSimple(this.genericAttackTrigger.handle, Player(COLOUR.WHEAT)!, EVENT_PLAYER_UNIT_ATTACKED);
        this.genericAttackTrigger.addAction(() => this.DoGenericTowerAttacks());

        this.killingActionsTrigger = Trigger.create();
        TriggerRegisterPlayerUnitEventSimple(this.killingActionsTrigger.handle, Player(COLOUR.NAVY)!, EVENT_PLAYER_UNIT_DEATH);
        TriggerRegisterPlayerUnitEventSimple(this.killingActionsTrigger.handle, Player(COLOUR.TURQUOISE)!, EVENT_PLAYER_UNIT_DEATH);
        TriggerRegisterPlayerUnitEventSimple(this.killingActionsTrigger.handle, Player(COLOUR.VOILET)!, EVENT_PLAYER_UNIT_DEATH);
        TriggerRegisterPlayerUnitEventSimple(this.killingActionsTrigger.handle, Player(COLOUR.WHEAT)!, EVENT_PLAYER_UNIT_DEATH);
        this.killingActionsTrigger.addAction(() => this.DoKillingTowerActions());
    }


    private UpgradeTower(): void {
        const tower = Unit.fromEvent();

        if (!tower) {
            Log.Error("Could not get affected tower for upgrade")
            return;
        }
        const owner: Defender | undefined = this.game.players.get(tower.owner.id);
        if (!owner) {
            return;
        }
        const instance: Tower | undefined = owner.GetTower(tower.id);
        if (instance) {
            instance.Sell();
            const newTower: Tower = this.game.worldMap.towerConstruction.SetupTower(tower, owner);
            newTower.towerValue += instance.towerValue;
            newTower.AddRefundableValue(instance.refundableValue);
        }
    }

    /**
     * This method is triggered when construction of a building starts. For hybrid builder.
     * It checks the constructing unit against the `DummyTowersMap` map, which contains predefined 'dummy' buildings.
     * If the building is a 'dummy' Tower, it will be replaced with the player's hybrid Tower of the corresponding tier by using the `ReplaceUnit` function.
     * After replacing the 'dummy' Tower, `SetupTower` method is called to finalize setting up the Tower.
     * If the constructing unit is not a 'dummy' Tower or if replacing the tower failed, no further action will be taken.
     */
    private ConstructionStarted() {
        // Output debug log
        Log.Debug('Start construction');

        // Get the unit from the triggered event
        const unit = Unit.fromEvent();

        // Check if unit exists and if its type ID is in the DummyTowersMap
        if (unit && DummyTowersMap[DecodeFourCC(unit.typeId)]) {
            Log.Debug('Found unit');

            // Get the dummy tower info based on unit type ID
            const dummyTower = DummyTowersMap[DecodeFourCC(unit.typeId)];

            // Get owner ID of the unit
            const ownerId = unit.owner.id;

            // Output debug log with owner ID and expected player ID of the tower
            Log.Debug(`owner id: ${ownerId}, tower expects: ${dummyTower.playerId}`);

            // If the unit's owner's ID matches the one expected by the tower
            if (ownerId === dummyTower.playerId) {
                Log.Debug('Found owner');

                // Get the owner player data
                const owner = this.game.players.get(ownerId);
                if(!owner) {
                    Log.Error('Could not find owner');
                    return;
                }
                const tierTower = owner.hybridTowers[dummyTower.tier];
                if(owner.getGold() < tierTower.goldCost) {
                    unit.destroy();
                    return;
                }
                owner.giveGold(tierTower.goldCost * -1);


                // Replace the unit with a new tower, based on the owner's tower tier
                const newUnit = ReplaceUnit(unit, FourCC(tierTower.id), bj_UNIT_STATE_METHOD_DEFAULTS)

                // If the unit failed to get replaced, terminate the function
                if(!newUnit) {
                    return;
                }

                Log.Debug('Setup');

                // Call the method to setup the new tower
                this.SetupTower(newUnit, owner!);
            }
        }
    }

    private ConstructionFinished(): void {
        const tower = Unit.fromEvent();

        if (!tower) {
            Log.Error("Could not get affected tower for construction ended event")
            return;
        }
        const owner: Defender | undefined = this.game.players.get(tower.owner.id);
        tower.removeAbility(FourCC('ARal'))

        if (!owner) {
            return;
        }

        this.SetupTower(tower, owner);
    }

    /**
     * Creates a finished tower directly, as if a builder had just completed it: the tower
     * logic is attached and its cells are blocked in the lane's maze. Returns undefined -
     * creating nothing - when the footprint is not buildable terrain or the game would shift
     * the building off (x, y): a silently shifted tower could block or open the maze, and
     * the anti-block check only runs for real construction.
     */
    public placeTower(owner: Defender, typeId: number, x: number, y: number): Unit | undefined {
        SyncTrace.note('build', `p${owner.id} type=${typeId} at=${Math.floor(x)},${Math.floor(y)}`);
        if (!this.isBuildable(x, y)) {
            return undefined;
        }
        const unit = Unit.create(owner, typeId, x, y, 270.00);
        if (!unit) {
            return undefined;
        }
        if (this.snap(unit.x) !== x || this.snap(unit.y) !== y) {
            unit.destroy();
            return undefined;
        }
        // Same as a finished construction: no rally point
        unit.removeAbility(FourCC('ARal'));
        this.SetupTower(unit, owner);
        const lane = this.game.mapSettings.PLAYER_AREAS.findIndex(area => area.ContainsUnit(unit));
        if (lane !== -1) {
            this.game.worldMap.playerMazes[lane].setFootprint(x, y, Walkable.Blocked);
        }
        return unit;
    }

    /** Whether all four cells of a 2x2 footprint centred on the grid corner (x, y) are buildable. */
    public isBuildable(x: number, y: number): boolean {
        for (const dx of [-32, 32]) {
            for (const dy of [-32, 32]) {
                // The native answers whether the point is NOT pathable for the given type
                if (IsTerrainPathable(x + dx, y + dy, PATHING_TYPE_BUILDABILITY)) {
                    return false;
                }
            }
        }
        return true;
    }

    /** Tower centres sit on grid corners. */
    private snap(value: number): number {
        return Math.floor(value / 64 + 0.5) * 64;
    }

    public SetupTower(tower: Unit, owner: Defender): Tower {
        let ObjectExtendsTower: Tower;
        if (this.isLootBoxer(tower)) {
            tower = this.lootBoxerHander.handleLootBoxTower(tower, owner, this.lootBoxerTowers.indexOf(tower.typeId));
            tower.removeAbility(FourCC('ARal'));
        }

        const obj: object | undefined = this._towerTypes.get(tower.typeId);
        if (obj) {
            // @ts-ignore
            ObjectExtendsTower = new obj(tower, owner, this.game);
        } else {
            ObjectExtendsTower = new Tower(tower, owner, this.game);
        }

        if (ObjectExtendsTower.IsEndOfRoundTower() && this.game.worldMap.gameRoundHandler) {
            this.game.worldMap.gameTurn.AddEndOfRoundTower(ObjectExtendsTower.UniqueID, ObjectExtendsTower);
        }
        if (ObjectExtendsTower.IsAttackActionTower()) {
            this.game.gameDamageEngine.AddInitialDamageEventTower(ObjectExtendsTower.UniqueID, ObjectExtendsTower);
        }

        if (ObjectExtendsTower.IsInitialDamageModificationTower()) {
            this.game.gameDamageEngine.AddInitialDamageModificationEventTower(ObjectExtendsTower.UniqueID, ObjectExtendsTower);
        }

        if (ObjectExtendsTower.IsGenericAutoAttackTower()) {
            this.genericAttacks.set(ObjectExtendsTower.UniqueID, ObjectExtendsTower);
        }
        if (ObjectExtendsTower.IsKillingActionTower()) {
            this.killingActions.set(ObjectExtendsTower.UniqueID, ObjectExtendsTower);
        }
        if (ObjectExtendsTower.IsLimitedTower()) {
            if (owner.hasHybridRandomed) {
                if (owner.hybridTowers.findIndex(elem => elem.id === DecodeFourCC(ObjectExtendsTower.GetTypeID())) >= 0 ||
                    owner.hybridTowers.findIndex(() => 'h03T' === DecodeFourCC(ObjectExtendsTower.GetTypeID())) >= 0) {
                    // SetPlayerTechMaxAllowedSwap(GetUnitTypeId(ObjectExtendsTower.tower), ObjectExtendsTower.MaxCount(), owner);
                    owner.setTechMaxAllowed(ObjectExtendsTower.unit.typeId, ObjectExtendsTower.MaxCount())
                }
            } else {
                owner.setTechMaxAllowed(ObjectExtendsTower.unit.typeId, ObjectExtendsTower.MaxCount())
            }
        }
        if (ObjectExtendsTower.IsConstructActionTower()) {
            ObjectExtendsTower.ConstructionFinished();
        }
        if (ObjectExtendsTower.IsTickingTower()) {
            this.game.towerTicker.AddTickingTower(ObjectExtendsTower.UniqueID, ObjectExtendsTower);
        }
        if (ObjectExtendsTower.IsTowerForceTower()) {
            if (owner.towerForces.has(ObjectExtendsTower.GetTypeID())) {
                owner.towerForces.set(ObjectExtendsTower.GetTypeID(), <number>owner.towerForces.get(ObjectExtendsTower.GetTypeID()) + 1);
                for (const towerx of owner.towersArray) {
                    if (towerx.IsTowerForceTower() && towerx.GetTypeID === ObjectExtendsTower.GetTypeID) {
                        towerx.UpdateSize();
                    }
                }
            } else {
                owner.towerForces.set(ObjectExtendsTower.GetTypeID(), 1);
            }
        }


        if (ObjectExtendsTower.IsAreaEffectTower()) {
            let area: number | undefined;

            for (let i: number = 0; i < this.game.mapSettings.PLAYER_AREAS.length; i++) {
                if (this.game.mapSettings.PLAYER_AREAS[i].ContainsUnit(tower)) {
                    area = i;
                    break;
                }
            }
            if (area) {
                this.game.worldMap.playerSpawns[area].areaTowers.set(ObjectExtendsTower.UniqueID, ObjectExtendsTower);
            } else {
                Log.Fatal(`${tower.name} built outside of requires area. Please screenshot and report`);
            }
        }
        // Log.Event(1, `{"tower":"${DecodeFourCC(ObjectExtendsTower.GetID())}", "owner": "${ObjectExtendsTower.owner.GetLogStr()}"}`);
        return ObjectExtendsTower;
    }


    private DoGenericTowerAttacks(): void {
        const generic: GenericAutoAttackTower | undefined = this.genericAttacks.get(GetHandleId(GetAttacker()!));
        if (generic) {
            generic.GenericAttack();
        }
    }

    private DoKillingTowerActions(): void {
        const killing: KillingActionTower | undefined = this.killingActions.get(GetHandleId(GetKillingUnit()!));
        if (killing) {
            killing.KillingAction();
        }
    }

    private isLootBoxer(tower: Unit): boolean {
        return this.lootBoxerTowers.indexOf(tower.typeId) > -1;
    }


}
