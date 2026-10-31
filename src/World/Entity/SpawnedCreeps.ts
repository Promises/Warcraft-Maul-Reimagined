import { Creep } from './Creep';
import { rollBounty } from './CreepBounty';
import * as settings from '../GlobalSettings';
import { WorldMap } from '../WorldMap';
import { Defender } from './Players/Defender';
import { Tower } from './Tower/Specs/Tower';
import {Trigger, Unit} from "w3ts";
import {SyncTrace} from '../../lib/SyncTrace';

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
        SyncTrace.note('death', `${SyncTrace.unit(dyingUnit)} type=${dyingUnit?.typeId}`);
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

        // Gold bounty (the engine's own bounty is off, see Attacker): roll it here with the synced
        // RNG and split it 60% to the creep's spawn-lane holder, 40% to the killer. An unheld spawn
        // lane gives the killer the whole bounty; a creep killed in its own lane sends both shares
        // to the one player, i.e. 100%.
        const bounty: number = rollBounty(creep.getTypeId());
        if (bounty > 0) {
            const spawnHolder: Defender | undefined = this.worldMap.game.laneHolders.get(creep.spawnLane);
            if (spawnHolder && player) {
                const spawnShare: number = Math.floor(bounty * 0.6);
                const killShare: number = bounty - spawnShare;
                spawnHolder.giveGold(spawnShare);
                player.giveGold(killShare);
                if (spawnHolder === player) {
                    this.showGoldGain(creep, player, bounty);
                } else {
                    this.showGoldGain(creep, player, killShare);
                    this.showGoldGain(creep, spawnHolder, spawnShare);
                }
            } else if (player) {
                player.giveGold(bounty);
                this.showGoldGain(creep, player, bounty);
            } else if (spawnHolder) {
                spawnHolder.giveGold(bounty);
                this.showGoldGain(creep, spawnHolder, bounty);
            }
        }

        this.unitMap.delete(creep.getHandleId());
        creep.unit.destroy();
    }

    /**
     * Floating gold text above a dying creep, shown only to the player who earned it. Replaces the
     * engine's own bounty text, which went away when the engine's auto-bounty was turned off for the
     * 60/40 split. Text tags are local, so this is visual only and can't desync.
     */
    private showGoldGain(creep: Creep, player: Defender, amount: number): void {
        const tag: texttag | undefined = CreateTextTagUnitBJ(`+${amount}`, creep.unit.handle, 16, 10, 100, 85, 0, 0);
        if (!tag) {
            return;
        }
        SetTextTagPermanentBJ(tag, false);
        SetTextTagLifespanBJ(tag, 1.50);
        SetTextTagVelocityBJ(tag, 64, 90);
        if (GetLocalPlayer() !== player.handle) {
            SetTextTagVisibility(tag, false);
        }
    }
}
