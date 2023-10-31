import { CheckPoint } from './CheckPoint';
import { WorldMap } from '../WorldMap';
import { SpawnedCreeps } from './SpawnedCreeps';
import { Creep } from './Creep';
import { PassiveCreepDiesInAreaEffectTower } from './Tower/Specs/PassiveCreepDiesInAreaEffectTower';
import { Rectangle } from '../../JassOverrides/Rectangle';
import { Defender } from './Players/Defender';
import { CreepAbility } from './CreepAbilities/specs/CreepAbility';
import { Log } from '../../lib/Serilog/Serilog';
import { WaveCreep } from './WaveCreep';
import { AbstractGameRound } from '../Game/BaseMaul/AbstractGameRound';
import {Trigger, MapPlayer,Unit} from "w3ts";
import {COLOUR} from "../../lib/translators";

export class PlayerSpawns {
    private _spawnOne: CheckPoint | undefined;
    private _spawnTwo: CheckPoint | undefined;
    public areaTowers: Map<number, PassiveCreepDiesInAreaEffectTower> = new Map<number, PassiveCreepDiesInAreaEffectTower>();


    public oneTrig: Trigger | undefined;
    public twoTrig: Trigger | undefined;
    public isOpen: boolean;
    public worldMap: WorldMap;
    public colourId: number;
    private readonly area: Rectangle;
    private enterTrig: Trigger;

    constructor(worldMap: WorldMap, colourId: number) {
        this.worldMap = worldMap;
        this.isOpen = false;
        this.colourId = colourId;
        this.area = this.worldMap.game.mapSettings.PLAYER_AREAS[this.colourId];
        this.enterTrig = Trigger.create();


        this.area.registerUnitTrigger(this.enterTrig);
        this.enterTrig.addAction(() => this.EnterRegions());
    }


    get spawnOne(): CheckPoint | undefined {
        return this._spawnOne;
    }

    set spawnOne(value: CheckPoint | undefined) {
        this._spawnOne = value;
        if (this.spawnOne) {
            this.oneTrig = Trigger.create();
            TriggerRegisterEnterRectSimple(this.oneTrig.handle, this.spawnOne.rectangle);

            this.oneTrig.addCondition(() => this.EnteringUnitIsCreepAndHasNoCheckpoint());
            this.oneTrig.addAction(() => this.SpawnAction(<CheckPoint>this.spawnOne));
        }

    }

    get spawnTwo(): CheckPoint | undefined {
        return this._spawnTwo;
    }

    set spawnTwo(value: CheckPoint | undefined) {
        this._spawnTwo = value;
        if (this.spawnTwo) {
            this.twoTrig = Trigger.create();
            TriggerRegisterEnterRectSimple(this.twoTrig.handle, this.spawnTwo.rectangle);

            this.twoTrig.addCondition(() => this.EnteringUnitIsCreepAndHasNoCheckpoint());
            this.twoTrig.addAction(() => this.SpawnAction(<CheckPoint>this.spawnTwo));

        }
    }
    public SpawnCreep(
        gameRound: AbstractGameRound,
        spawned: Map<number, Creep>,
        abilities: CreepAbility[],
        wave: WaveCreep,
        creepOwner: number
    ): void {
        if (!this.isOpen) {
            return;
        }
        if (this.spawnOne) {
            const player = MapPlayer.fromIndex(COLOUR.NAVY + creepOwner % 4)!;
            let creep = Unit.create(
                player,
                wave.GetTypeID(),
                GetRectCenterX(this.spawnOne.rectangle),
                GetRectCenterY(this.spawnOne.rectangle),
                this.getSpawnFace(this.colourId)
            )!;
            spawned.set(creep.id, new Creep(creep, gameRound, abilities, this.worldMap.game));

            if (wave.GetWaveNumber() !== 37 && this.spawnTwo) {
                creep = Unit.create(
                    player,
                    wave.GetTypeID(),
                    GetRectCenterX(this.spawnTwo.rectangle),
                    GetRectCenterY(this.spawnTwo.rectangle),
                    this.getSpawnFace(this.colourId)
                )!;
                spawned.set(creep.id, new Creep(creep, gameRound, abilities, this.worldMap.game));
            }
        }
    }

    private getSpawnFace(id: COLOUR): number {
        switch (id) {
            case COLOUR.RED:
            case COLOUR.PINK:
                return 180;
            case COLOUR.BLUE:
            case COLOUR.PURPLE:
            case COLOUR.YELLOW:
            case COLOUR.ORANGE:
            case COLOUR.GRAY:
            case COLOUR.BROWN:
            case COLOUR.MAROON:
                return 270;
            case COLOUR.TEAL:
            case COLOUR.GREEN:
                return 0;
            case COLOUR.LIGHT_BLUE:
            case COLOUR.DARK_GREEN:
                return 90;
            default:
                Log.Error(`getSpawnFace, could not find player: ${id}`);
                return 0;

        }
    }

    public EnteringUnitIsCreepAndHasNoCheckpoint(): boolean {
        const enteringUnit = Unit.fromHandle(GetEnteringUnit());
        if (!enteringUnit || !this.isEnteringUnitCreep(enteringUnit)) {
            return false;
        }

        const spawnedCreeps: SpawnedCreeps = this.worldMap.spawnedCreeps;
        // if (spawnedCreeps) {
            const spawnedCreep = spawnedCreeps.unitMap.get(enteringUnit.id);
            if (spawnedCreep && spawnedCreep.targetCheckpoint) {
                return false;
            }
        // }

        return true;
    }


    public isEnteringUnitCreep(unit: Unit): boolean {
        const ownerID: COLOUR = unit.getOwner()?.id as COLOUR;
        switch (ownerID) {
            case COLOUR.NAVY:
            case COLOUR.TURQUOISE:
            case COLOUR.VOILET:
            case COLOUR.WHEAT:
                return true;
            default:
                return false;
        }
    }

    private SpawnAction(spawn: CheckPoint): void {
        // If spawnOne is set and the provided spawn doesn't have a next checkpoint,
        // then use spawnOne as the spawn checkpoint.
        if (this.spawnOne && !spawn.next) {
            spawn = this.spawnOne;
        }

        // Exit if the spawn does not have a next checkpoint.
        if (!spawn.next) {
            return;
        }

        const enteringUnit = Unit.fromHandle(GetEnteringUnit());
        const spawnedCreeps = this.worldMap.spawnedCreeps;

        if (enteringUnit && spawnedCreeps) {
            const spawnedCreep = spawnedCreeps.unitMap.get(enteringUnit.id);

            if (spawnedCreep) {
                spawnedCreep.targetCheckpoint = spawn.next;
                spawnedCreep.OrderMove(GetRectCenterX(spawn.next.rectangle), GetRectCenterY(spawn.next.rectangle));
                spawnedCreep.AddCreepAbilities();
            }
        }
    }



    public AreaTowerActions(dyingCreep: Creep): void {
        for (const tower of this.areaTowers.values()) {
            tower.PassiveCreepDiesInAreaEffect(dyingCreep);
        }
    }

    private EnterRegions(): void {
        const enteringUnit = Unit.fromHandle(GetEnteringUnit());
        if(!enteringUnit) {
            return;
        }

        if (this.isEnteringUnitCreep(enteringUnit)) {
            if (!this.isOpen && !(UnitHasBuffBJ(enteringUnit.handle, FourCC('Bblo')))) {
                const dummy = Unit.create(MapPlayer.fromIndex(PLAYER_NEUTRAL_PASSIVE)!, FourCC('u008'), 0.0, -5300.0, bj_UNIT_FACING);
                dummy?.addAbility(FourCC('A068'));
                dummy?.issueTargetOrder('bloodlust', enteringUnit);
                dummy?.applyTimedLife(1.00, FourCC('BTLF'));
            } else {
                UnitRemoveBuffBJ(FourCC('Bblo'),enteringUnit.handle);
            }
        } else if (IsUnitType(enteringUnit.handle, UNIT_TYPE_SUMMONED)) {
            this.handleSummonedUnitEntry(enteringUnit);
        } else {
            this.handleOtherUnitEntry(enteringUnit);
        }
    }

    private handleSummonedUnitEntry(enteringUnit: Unit): void {
        if (enteringUnit.typeId !== FourCC('u008') && enteringUnit.getOwner() !== MapPlayer.fromIndex(this.colourId)) {
            enteringUnit.setPosition(this.area.GetCenterX(), this.area.GetCenterY());
        }
    }

    private handleOtherUnitEntry(enteringUnit: Unit): void {
        if (this.worldMap.game.players.get(this.colourId) && !IsUnitType(enteringUnit.handle, UNIT_TYPE_STRUCTURE)) {
            const areaPlayer: Defender = <Defender>this.worldMap.game.players.get(this.colourId);
            if (areaPlayer.HasDenied(enteringUnit.getOwner()!.id)) {
                enteringUnit.setPosition(
                    this.worldMap.game.mapSettings.PLAYER_AREAS[enteringUnit.getOwner()!.id].GetCenterX(),
                    this.worldMap.game.mapSettings.PLAYER_AREAS[enteringUnit.getOwner()!.id].GetCenterY());
            }
        }
    }

}
