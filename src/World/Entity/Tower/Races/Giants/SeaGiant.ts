import { Tower } from '../../Specs/Tower';
import { KillingActionTower } from '../../Specs/KillingActionTower';
import {Util} from "../../../../../lib/translators";
import {Unit} from "w3ts";

export class SeaGiant extends Tower implements KillingActionTower {


    public KillingAction(): void {
        const u: unit | undefined = GetKillingUnitBJ();
        const target: unit | undefined = GetDyingUnit();

        if (u === this.unit.handle && target) {
            const x: number = GetUnitX(target);
            const y: number = GetUnitY(target);
            const rand: number = Util.RandomInt(0, 359);
            const dummyOne = Unit.create(this.owner, FourCC('u008'), x + 10 * CosBJ(rand + 45), y + 10 * SinBJ(rand + 45), 0);
            const dummyTwo = Unit.create(this.owner, FourCC('u008'), x + 10 * CosBJ(rand + 135), y + 10 * SinBJ(rand + 135), 0);
            const dummyThree = Unit.create(this.owner, FourCC('u008'), x + 10 * CosBJ(rand + 225), y + 10 * SinBJ(rand + 225), 0);
            const dummyFour = Unit.create(this.owner, FourCC('u008'), x + 10 * CosBJ(rand + 315), y + 10 * SinBJ(rand + 315), 0);
            dummyOne?.applyTimedLife(FourCC('BTLF'), 1.00)
            dummyTwo?.applyTimedLife(FourCC('BTLF'), 1.00)
            dummyThree?.applyTimedLife(FourCC('BTLF'), 1.00)
            dummyFour?.applyTimedLife(FourCC('BTLF'), 1.00)
            dummyOne?.addAbility(FourCC('A03T'))
            dummyTwo?.addAbility(FourCC('A03T'))
            dummyThree?.addAbility(FourCC('A03T'))
            dummyFour?.addAbility(FourCC('A03T'))
            dummyOne?.issueOrderAt('carrionswarm', x + 150 * CosBJ(rand + 45), y + 150 * SinBJ(rand + 45))
            dummyTwo?.issueOrderAt('carrionswarm', x + 150 * CosBJ(rand + 135), y + 150 * SinBJ(rand + 135))
            dummyThree?.issueOrderAt('carrionswarm', x + 150 * CosBJ(rand + 225), y + 150 * SinBJ(rand + 225))
            dummyFour?.issueOrderAt('carrionswarm', x + 150 * CosBJ(rand + 315), y + 150 * SinBJ(rand + 315))
        }

    }


}
