import { Race } from './Race';
import { Defender } from '../../Entity/Players/Defender';
import {Unit} from "w3ts";
import {SyncTrace} from '../../../lib/SyncTrace';

export class RaceLootBoxer extends Race {
    public get randomOnly(): boolean {
        return true;
    }

    public pickAction(player: Defender): void {
        if (player.lootBoxer) {
            player.sendMessage('I\'m sorry Dave, I\'m afraid I can\'t do that');
            player.giveLumber(1);
            return;
        }

        player.lootBoxer = Unit.create(player, FourCC(this.id), player.getCenterX(), player.getCenterY(), bj_UNIT_FACING);
        SyncTrace.note('race', `p${player.id} got builder ${this.id} id=${SyncTrace.unit(player.lootBoxer)}`);
        player.builders.push(player.lootBoxer!);
    }
}
