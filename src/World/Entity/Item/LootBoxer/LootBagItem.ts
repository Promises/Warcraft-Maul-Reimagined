import { WarcraftMaul } from '../../../WarcraftMaul';
import { StackingItem } from '../Specs/StackingItem';
import {Unit} from "w3ts";
import {Util} from "../../../../lib/translators";

export class LootBagItem extends StackingItem {
    constructor(game: WarcraftMaul) {
        super('I02B', game);
    }


    public ManipulateAction(): void {
        const roll: number = Util.RandomInt(1, 100);
        const triggerUnit = Unit.fromEvent();

        if (roll <= 40) {
            triggerUnit?.addItemById(FourCC('I029'));
        } else if (roll <= 80) {
            triggerUnit?.addItemById(FourCC('I02F'));
        } else if (roll <= 95) {
            triggerUnit?.addItemById(FourCC('I028'));
        } else {
            triggerUnit?.addItemById(FourCC('I02A'));
        }


    }

}
