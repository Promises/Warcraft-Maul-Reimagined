import { Race } from './Race';
import { Defender } from '../../Entity/Players/Defender';
import {Unit} from "w3ts";

export class RaceVoid extends Race {
    pickAction(player: Defender): void {
        player.voidBuilder = Unit.create(player, FourCC(this.id), player.getCenterX(), player.getCenterY(), bj_UNIT_FACING);
        const voidBuilder: Unit | undefined = player.getVoidBuilder();
        if (voidBuilder !== undefined) {
            voidBuilder.addAbility(FourCC('I01Y'));
            voidBuilder.addAbility(FourCC('I01Z'));
            voidBuilder.addAbility(FourCC('I020'));
            voidBuilder.addAbility(FourCC('I01X'));
            voidBuilder.addAbility(FourCC('I02E'));
            player.builders.push(voidBuilder);
        }
    }
}
