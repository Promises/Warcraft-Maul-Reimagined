import { Defender } from '../../Entity/Players/Defender';
import { WorldMap } from '../../WorldMap';
import {Unit} from "w3ts";
import {SyncTrace} from '../../../lib/SyncTrace';
import {RaceItems} from './RaceItems';

export class Race {
    id: string;
    name: string;
    itemid: string;
    enabled: boolean;
    map: WorldMap;

    constructor(id: string, name: string, itemid: string, map: WorldMap, enabled: boolean = true) {
        this.id = id;
        this.name = name;
        this.itemid = itemid;
        this.enabled = enabled;
        this.map = map;
        if (!enabled) {
            map.disabledRaces++;
        }
    }

    /**
     * A secondary race (its item's tooltip says "Secondary Race"): picked in the race picker's
     * Secondary tab, only by a player who has a race already, for the usual lumber. It is never
     * in the normal tabs or the random race picks, which is what `enabled = false` keeps it out of
     * (its towers are still in the hybrid tower pool).
     */
    public get secondary(): boolean {
        return RaceItems[this.itemid]?.tier === 'Secondary';
    }

    public pickAction(player: Defender): void {
        const builder = Unit.create(player, FourCC(this.id), player.getCenterX(), player.getCenterY(), bj_UNIT_FACING)!;
        SyncTrace.note('race', `p${player.id} got builder ${this.id} id=${SyncTrace.unit(builder)}`);
        player.builders.push(builder);
    }
}
