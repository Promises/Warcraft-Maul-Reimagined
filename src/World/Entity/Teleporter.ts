import {CheckPoint} from './CheckPoint';
import {WorldMap} from '../WorldMap';
import {SpawnedCreeps} from './SpawnedCreeps';
import {Creep} from './Creep';
import {Effect, Unit} from "w3ts";

export class Teleporter extends CheckPoint {
    private readonly facing: number;

    constructor(rectangle: rect, worldMap: WorldMap, facing: number) {
        super(rectangle, worldMap);
        this.facing = facing;
    }

    public CheckPointAction(): void {
        if (!this.next) {
            return;
        }

        const x: number = GetRectCenterX(this.next.rectangle);
        const y: number = GetRectCenterY(this.next.rectangle);

        const enteringUnit = Unit.fromHandle(GetEnteringUnit());

        const spawnedCreeps: SpawnedCreeps | undefined = this.worldMap.spawnedCreeps;
        if (enteringUnit && spawnedCreeps) {
            const spawnedCreep: Creep | undefined = spawnedCreeps.unitMap.get(enteringUnit.id);
            if (spawnedCreep) {
                spawnedCreep.targetCheckpoint = this.next;
                spawnedCreep.unit.setPosition(x, y);
                spawnedCreep.unit.facing = this.facing;

                Effect.create('Abilities/Spells/Human/MassTeleport/MassTeleportCaster.mdl', x, y)?.destroy();

                spawnedCreep.OrderMove(GetRectCenterX(this.next.rectangle), GetRectCenterY(this.next.rectangle));
            }
        }
    }

}
