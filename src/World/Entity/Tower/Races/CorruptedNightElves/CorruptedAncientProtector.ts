import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import { Unit } from "w3ts";

export class CorruptedAncientProtector extends Tower implements TickingTower {

    public Action(): void {
        if (this.game.worldMap.gameRoundHandler && this.game.worldMap.gameRoundHandler.isWaveInProgress) {

            const tempUnit = Unit.create(
                this.owner,
                FourCC('u008'),
                this.unit.x,
                this.unit.y,
                bj_UNIT_FACING
            );

            tempUnit?.applyTimedLife(FourCC('BTLF'), 11.00);
            tempUnit?.addAbility(FourCC('A010'));
            tempUnit?.issueImmediateOrder('starfall');
        }
    }

    public GetTickModulo(): number {
        return 300;
    }

}
