import { Tower } from '../../Specs/Tower';
import { KillingActionTower } from '../../Specs/KillingActionTower';

export class Hydralisk extends Tower implements KillingActionTower {


    public KillingAction(): void {
        const u: unit | undefined = GetKillingUnitBJ();
        const target: unit | undefined = GetDyingUnit();


        if (u === this.unit.handle && target) {

            if (this.unit.getAbilityLevel(FourCC('A0EH')) <= 50) {
                this.unit.incAbilityLevel(FourCC('A0EH'));
            }

            if (this.unit.getAbilityLevel(FourCC('A0EH')) <= 50) {
                this.unit.incAbilityLevel(FourCC('A0EI'));
            }

        }

    }


}
