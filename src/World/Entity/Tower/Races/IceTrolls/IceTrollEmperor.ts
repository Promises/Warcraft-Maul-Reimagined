import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import {Unit} from "w3ts";

export class IceTrollEmperor extends Tower implements TickingTower {
    public Action(): void {
        if (this.game.worldMap.gameRoundHandler && this.game.worldMap.gameRoundHandler.isWaveInProgress) {

            this.CastBlizzard();
        }
    }

    public GetTickModulo(): number {
        return 10;
    }


    private CastBlizzard(): void {
        const unitX: number = this.unit.x;
        const unitY: number = this.unit.y;
        const x: number = unitX + GetRandomReal(0.00, 500.00) - 250.00;
        const y: number = unitY + GetRandomReal(0.00, 500.00) - 250.00;
        const dummy = Unit.create(this.owner, FourCC('u008'), x, y, 0);
        dummy?.applyTimedLife(FourCC('BTLF'), 2.00)
        dummy?.addAbility(FourCC('A0CO'))
        dummy?.issueOrderAt('blizzard', x, y)
    }
}
