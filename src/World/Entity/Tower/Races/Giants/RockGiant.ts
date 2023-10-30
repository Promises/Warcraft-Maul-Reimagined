import { Tower } from '../../Specs/Tower';
import { KillingActionTower } from '../../Specs/KillingActionTower';

export class RockGiant extends Tower implements KillingActionTower {

    public KillingAction(): void {
        const u: unit | undefined = GetKillingUnitBJ();
        const target: unit | undefined = GetDyingUnit();

        if (u === this.unit.handle && target) {
            const mana: number = this.unit.mana + 1.00;
            this.unit.mana = mana;

            if (mana > 39) {
                this.unit.mana = 0.00;
                this.Upgrade(FourCC('h00A'));
            }
        }
    }
}
