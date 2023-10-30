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
import {COLOUR, DecodeFourCC} from "../../../lib/translators";


export class TowerConstruction {
    private races: RaceTowers[] = [];

    get towerTypes(): TowerMap<number, object> {
        return this._towerTypes;
    }

    private towerConstructTrigger: Trigger;
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
                if (owner.hybridTowers.findIndex(elem => elem === DecodeFourCC(ObjectExtendsTower.GetTypeID())) >= 0 ||
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
