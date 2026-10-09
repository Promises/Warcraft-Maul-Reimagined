import { StackingItem } from '../Specs/StackingItem';
import { WarcraftMaul } from '../../../WarcraftMaul';
import {Item, Unit} from "w3ts";

// Rocks it takes to make a Lootbag
const ROCKS_PER_BAG = 9;

/**
 * Rocks: a stack of 9 used turns into a Lootbag; a smaller stack used stays as it was. The game
 * has already taken the used charge when this runs (a stack of 9 shows 8 here), so it is counted
 * back in: 9 Rocks are spent on a bag, and none on a stack too small for one.
 */
export class Rocks extends StackingItem {
    constructor(game: WarcraftMaul) {
        super('I02F', game);
    }

    public ManipulateAction(): void {
        const rocks = Item.fromHandle(GetManipulatedItem())!;
        const stack = rocks.charges + 1;

        if (stack < ROCKS_PER_BAG) {
            rocks.charges = stack;
            return;
        }
        const user = Unit.fromHandle(GetManipulatingUnit())!;
        if (stack === ROCKS_PER_BAG) {
            user.removeItem(rocks);
            rocks.destroy();
        } else {
            rocks.charges = stack - ROCKS_PER_BAG;
        }
        user.addItemById(FourCC('I02B'));
    }
}
