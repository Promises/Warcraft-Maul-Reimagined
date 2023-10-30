import { Creep } from './Creep';
import * as settings from '../GlobalSettings';
import { WorldMap } from '../WorldMap';
import { Defender } from './Players/Defender';
import { Tower } from './Tower/Specs/Tower';
import {Trigger, Unit} from "w3ts";

export class SpawnedCreeps {
    public unitMap: Map<number, Creep> = new Map<number, Creep>();
    private unitDiesTrigger: Trigger;
    private worldMap: WorldMap;

    private chimearaIds: number[] = [
        FourCC('e004'),
        FourCC('e009'),
        FourCC('e00U'),
        FourCC('e00V'),
        FourCC('e000'),
    ];

    constructor(worldMap: WorldMap) {
        this.worldMap = worldMap;
        // let creativeName = CreateUnit(Player(COLOUR.NAVY), FourCC('u000'), -64.00, 4032.00, 240.0);
        // this.unitMap.set(GetHandleIdBJ(creativeName), new Creep(creativeName));
        // const triggerTest: Trigger = Trigger.create();
        // triggerTest.registerAnyUnitEventBJ(EVENT_PLAYER_UNIT_SELECTED);
        // triggerTest.addAction(() => this.printUnit());


        this.unitDiesTrigger = Trigger.create();
        this.unitDiesTrigger.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH);
        this.unitDiesTrigger.addAction(() => this.RemoveDeadCreeps());
    }

    private printUnit(): void {
        const triggeredUnit = Unit.fromEvent();
        const test: Creep | undefined = this.unitMap.get(triggeredUnit?.id!);

        if (test !== undefined) {
            test.printId();
        }
    }


    private RemoveDeadCreeps(): void {
        const dyingUnit = Unit.fromHandle(GetDyingUnit());
        const creep: Creep | undefined = this.unitMap.get(dyingUnit?.id!);
        if (!creep) {
            // Handle spawns? spiders and alike?
            const dyingId: number = dyingUnit?.typeId!;
            const owningplayer: Defender | undefined = this.worldMap.game.players.get(dyingUnit?.getOwner()?.id!);
            if (this.chimearaIds.indexOf(dyingId) >= 0) {
                if (owningplayer) {
                    owningplayer.chimeraCount--;

                }
            }
            if (dyingId === FourCC('u042')) {
                if (owningplayer) {
                    owningplayer.zerglings--;

                }
            }
            if (owningplayer) {
                const tower: Tower | undefined = owningplayer.GetTower(dyingUnit?.id!);
                if (tower) {
                    tower.Remove();
                    return;
                }
            }
            dyingUnit?.destroy();
            return;
        }

        let area: number | undefined;

        for (let i: number = 0; i < this.worldMap.game.mapSettings.PLAYER_AREAS.length; i++) {
            if (this.worldMap.game.mapSettings.PLAYER_AREAS[i].ContainsCreep(creep)) {
                area = i;
                break;
            }
        }
        if (area) {
            this.worldMap.playerSpawns[area].AreaTowerActions(creep);
        }
        const killingUnit = Unit.fromHandle(GetKillingUnit());

        const player: Defender | undefined = this.worldMap.game.players.get(killingUnit?.getOwner()?.id!);
        if (player) {
            player.GiveKillCount();
        }

        this.unitMap.delete(creep.getHandleId());
        creep.unit.destroy();
    }
}
