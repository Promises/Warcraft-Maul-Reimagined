import { StackingItem } from '../Specs/StackingItem';
import { WarcraftMaul } from '../../../WarcraftMaul';
import {Item, Unit} from "w3ts";

export class Rocks extends StackingItem {
    constructor(game: WarcraftMaul) {
        super('I02F', game);
    }

    public ManipulateAction(): void {
        const manipulatedItem = Item.fromHandle(GetManipulatedItem());
        const currentCharges = manipulatedItem!.charges;

        if (currentCharges <= 8) {
            manipulatedItem!.charges += 1;
        } else {
            manipulatedItem!.charges -= 9;

            const manipulatingUnit = Unit.fromHandle(GetManipulatingUnit());
            manipulatingUnit!.addItemById(FourCC('I02B'));
        }
    }
}
