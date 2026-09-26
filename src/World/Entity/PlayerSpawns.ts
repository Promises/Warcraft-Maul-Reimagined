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
import {SyncTrace} from '../../lib/SyncTrace';

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


    /**
     * True if the rectangle overlaps any of this spawn's checkpoints (the creep entry/exit
     * cells). Used to stop hybrid towers being built on top of a checkpoint.
     */
    public overlapsCheckpoint(minX: number, minY: number, maxX: number, maxY: number): boolean {
        for (const start of [this._spawnOne, this._spawnTwo]) {
            let checkpoint: CheckPoint | undefined = start;
            let guard = 0;
            while (checkpoint && guard < 64) {
                const rect = checkpoint.rectangle;
                if (minX < GetRectMaxX(rect) && maxX > GetRectMinX(rect)
                    && minY < GetRectMaxY(rect) && maxY > GetRectMinY(rect)) {
                    return true;
                }
                checkpoint = checkpoint.next;
                guard++;
            }
        }
        return false;
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
            SyncTrace.note('spawn', `${SyncTrace.unit(creep)} type=${wave.GetTypeID()} lane=${this.colourId} owner=${creepOwner}`);

            if (wave.GetWaveNumber() !== 37 && this.spawnTwo) {
                creep = Unit.create(
                    player,
                    wave.GetTypeID(),
                    GetRectCenterX(this.spawnTwo.rectangle),
                    GetRectCenterY(this.spawnTwo.rectangle),
                    this.getSpawnFace(this.colourId)
                )!;
                spawned.set(creep.id, new Creep(creep, gameRound, abilities, this.worldMap.game));
                SyncTrace.note('spawn', `${SyncTrace.unit(creep)} type=${wave.GetTypeID()} lane=${this.colourId} owner=${creepOwner}`);
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
                dummy?.applyTimedLife(FourCC('BTLF'), 1.00);
            } else {
                UnitRemoveBuffBJ(FourCC('Bblo'),enteringUnit.handle);
            }
        } else if (IsUnitType(enteringUnit.handle, UNIT_TYPE_SUMMONED)) {
            this.handleSummonedUnitEntry(enteringUnit);
        } else {
            this.handleOtherUnitEntry(enteringUnit);
        }
    }

    /** The player defending this lane: its colour's player unless someone took the lane over. */
    private laneHolder(): Defender | undefined {
        return this.worldMap.game.laneHolders.get(this.colourId);
    }

    /** A summoned unit of another player is sent to the lane centre, out of the maze. */
    private handleSummonedUnitEntry(enteringUnit: Unit): void {
        if (enteringUnit.typeId !== FourCC('u008') && enteringUnit.getOwner()?.id !== this.laneHolder()?.id) {
            enteringUnit.setPosition(this.area.GetCenterX(), this.area.GetCenterY());
        }
    }

    /** A unit of a player the lane holder denied is sent back to its owner's own lane. */
    private handleOtherUnitEntry(enteringUnit: Unit): void {
        const holder = this.laneHolder();
        const owner = this.worldMap.game.players.get(enteringUnit.getOwner()!.id);
        if (holder && owner && !IsUnitType(enteringUnit.handle, UNIT_TYPE_STRUCTURE) && holder.HasDenied(owner.id)) {
            enteringUnit.setPosition(owner.getCenterX(), owner.getCenterY());
        }
    }

}
