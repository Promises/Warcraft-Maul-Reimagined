import { Race } from './Race';
import { Defender } from '../../Entity/Players/Defender';
import {Unit} from "w3ts";

export class RaceLootBoxer extends Race {
    public pickAction(player: Defender): void {
        if (player.lootBoxer) {
            player.sendMessage('I\'m sorry Dave, I\'m afraid I can\'t do that');
            player.giveLumber(1);
            return;
        }

        player.lootBoxer = Unit.create(player, FourCC(this.id), player.getCenterX(), player.getCenterY(), bj_UNIT_FACING);
        player.builders.push(player.lootBoxer!);

    }
}
