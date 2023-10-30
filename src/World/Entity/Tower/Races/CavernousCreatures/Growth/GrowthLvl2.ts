import { Defender } from '../../../../Players/Defender';
import { WarcraftMaul } from '../../../../../WarcraftMaul';
import { Tower } from '../../../Specs/Tower';
import {Unit} from "w3ts";

export class GrowthLvl2 extends Tower {

    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);

        this.unit.setAbilityLevel(FourCC('A0CG'), 2);
        this.unit.setAbilityLevel(FourCC('S00A'), 2);
    }
}
