import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class Tornado extends Tower implements EndOfRoundTower {

    public EndOfRoundAction(): void {
        if (this.unit.getAbility(FourCC('A0E0'))) {
            this.unit.removeAbility(FourCC('A0E0'));
            this.unit.addAbility(FourCC('A0E1'));
            this.unit.addAbility(FourCC('A0E2'));
        } else {
            this.unit.removeAbility(FourCC('A0E1'));
            this.unit.removeAbility(FourCC('A0E2'));
            this.unit.addAbility(FourCC('A0E0'));
        }
    }

}
