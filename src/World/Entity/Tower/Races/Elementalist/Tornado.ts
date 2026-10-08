import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

// Updraft: +20% attack speed for your towers within 500 (an Endurance Aura). It replaced
// Tailwind, which sped enemies up by 20% every other wave
const UPDRAFT = FourCC('A03Q');
// The other wave's slow aura and evasion
const CALM = [FourCC('A0E1'), FourCC('A0E2')];

/** Life + Air: Updraft for your towers one wave, a slow on enemies the next. */
export class Tornado extends Tower implements EndOfRoundTower {

    public EndOfRoundAction(): void {
        if (this.unit.getAbility(UPDRAFT)) {
            this.unit.removeAbility(UPDRAFT);
            CALM.forEach(ability => this.unit.addAbility(ability));
        } else {
            CALM.forEach(ability => this.unit.removeAbility(ability));
            this.unit.addAbility(UPDRAFT);
        }
    }

}
