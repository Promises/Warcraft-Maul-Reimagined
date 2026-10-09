import { WorldMap } from '../WorldMap';
import { SpawnedCreeps } from './SpawnedCreeps';
import { Creep } from './Creep';
import {COLOUR} from "../../lib/translators";
import {Trigger} from "w3ts";

// Far more checkpoints than any path has
const MAX_CHECKPOINTS = 200;

export class CheckPoint {
    private _previous: CheckPoint | undefined;
    private _next: CheckPoint | undefined;
    public rectangle: rect;
    public eventTrig: Trigger;
    public worldMap: WorldMap;


    constructor(rectangle: rect, worldMap: WorldMap) {
        this.rectangle = rectangle;
        this.worldMap = worldMap;
        this.eventTrig = Trigger.create();

        TriggerRegisterEnterRectSimple(this.eventTrig.handle, rectangle);

        this.eventTrig.addCondition(() => this.verifyTargetCheckpoint());
        this.eventTrig.addAction(() => this.CheckPointAction());


    }


    public verifyTargetCheckpoint(): boolean {

        if (!this.isEnteringUnitCreep) {
            return false;
        }
        const spawnedCreeps: SpawnedCreeps | undefined = this.worldMap.spawnedCreeps;
        if (spawnedCreeps !== undefined) {
            const spawnedCreep: Creep | undefined = spawnedCreeps.unitMap.get(GetHandleIdBJ(GetEnteringUnit()!));
            if (spawnedCreep !== undefined) {
                if (spawnedCreep.targetCheckpoint) {
                    return spawnedCreep.targetCheckpoint === this;
                }
            }
        }
        return true;
    }

    public CheckPointAction(): void {
        if (!this.next) {
            return;
        }
        const spawnedCreeps: SpawnedCreeps | undefined = this.worldMap.spawnedCreeps;
        if (spawnedCreeps !== undefined) {
            const creep: Creep | undefined = spawnedCreeps.unitMap.get(GetHandleIdBJ(GetEnteringUnit()!));
            if (creep !== undefined) {
                creep.targetCheckpoint = this.next;
                creep.OrderMove(GetRectCenterX(this.next.rectangle), GetRectCenterY(this.next.rectangle));
                if (UnitHasBuffBJ(GetEnteringUnit()!, FourCC('B028'))) {
                    creep.MorningPerson();
                }

            }
        }
    }


    /**
     * How many checkpoints from this one to the end of the path, this one included. The lanes' paths
     * join into one that ends in the gray lane, so the count compares creeps of any lane.
     */
    public checkpointsToEnd(): number {
        let count = 0;
        let checkpoint: CheckPoint | undefined = this;
        // The paths end; the bound only keeps a mistake in them from hanging the game
        while (checkpoint !== undefined && count < MAX_CHECKPOINTS) {
            count++;
            checkpoint = checkpoint.next;
        }
        return count;
    }

    get previous(): CheckPoint | undefined {
        return this._previous;
    }

    set previous(value: CheckPoint | undefined) {
        this._previous = value;
    }

    get next(): CheckPoint | undefined {
        return this._next;
    }

    set next(value: CheckPoint | undefined) {
        this._next = value;
    }


    public isEnteringUnitCreep(): boolean {
        const ownerID: COLOUR = GetPlayerId(GetOwningPlayer(GetEnteringUnit()!));
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

}


