import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import {Unit} from "w3ts";

export class OgreMagi extends Tower implements TickingTower {

    public Action(): void {
        const x: number = this.unit.x;
        const y: number = this.unit.y;
        const dummy = Unit.create(this.owner, FourCC('u008'), x, y, 0);
        dummy?.applyTimedLife(FourCC('BTLF'), 1.00);
        dummy?.addAbility(FourCC('A036'));
        dummy?.issueImmediateOrder('battleroar');
    }

    public GetTickModulo(): number {
        return 99;
    }
}
