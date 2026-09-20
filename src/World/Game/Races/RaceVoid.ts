import { Race } from './Race';
import { Defender } from '../../Entity/Players/Defender';
import {Unit} from "w3ts";

export class RaceVoid extends Race {
    pickAction(player: Defender): void {
        player.voidBuilder = Unit.create(player, FourCC(this.id), player.getCenterX(), player.getCenterY(), bj_UNIT_FACING);
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
