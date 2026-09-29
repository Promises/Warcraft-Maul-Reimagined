import { Race } from './Race';
import { Defender } from '../../Entity/Players/Defender';
import {Unit} from "w3ts";
import {SyncTrace} from '../../../lib/SyncTrace';

export class RaceVoid extends Race {
    pickAction(player: Defender): void {
        player.voidBuilder = Unit.create(player, FourCC(this.id), player.getCenterX(), player.getCenterY(), bj_UNIT_FACING);
        SyncTrace.note('race', `p${player.id} got builder ${this.id} id=${SyncTrace.unit(player.voidBuilder)}`);
        const voidBuilder: Unit | undefined = player.getVoidBuilder();
        if (voidBuilder !== undefined) {
            // These are the Void purchase items, not abilities
            voidBuilder.addItemById(FourCC('I01Y'));
            voidBuilder.addItemById(FourCC('I01Z'));
            voidBuilder.addItemById(FourCC('I020'));
            voidBuilder.addItemById(FourCC('I01X'));
            voidBuilder.addItemById(FourCC('I02E'));
            player.builders.push(voidBuilder);
        }
    }
}
