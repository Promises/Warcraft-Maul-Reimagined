import { StackingItem } from '../Specs/StackingItem';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { WCItem } from '../Specs/WCItem';
import {Unit} from "w3ts";

export class GoldCoin extends WCItem {
    constructor(game: WarcraftMaul) {
        super('I02A', game);
    }

    public ManipulateAction(): void {
        const manipulatingUnit = Unit.fromHandle(GetManipulatingUnit());

        if (this.game.worldMap.towerConstruction.lootBoxerTowers.indexOf(manipulatingUnit!.typeId) + 1 < 4) {
            return;
        }

        manipulatingUnit!.mana += 2.00;
    }

}
