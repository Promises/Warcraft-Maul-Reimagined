import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';

export class Blaze extends Tower implements EndOfRoundTower {


    public EndOfRoundAction(): void {
        // Burnt out: back to an Uncharged Rune, not rock
        this.Upgrade(FourCC('n00A'));
    }

}
