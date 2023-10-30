import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import {Unit} from "w3ts";

export class IronGolemStatue extends Tower implements TickingTower {

    public Action(): void {
        if (this.game.worldMap.gameRoundHandler && this.game.worldMap.gameRoundHandler.isWaveInProgress) {

            const x: number = this.unit.x;
            const y: number = this.unit.y;
            const impalers: Unit[] = [];

            const angles = [135, 225, 315, 45, 0, 90, 180, 270];

            angles.forEach((angle) => {
                const impaler = Unit.create(this.owner, FourCC('u008'), x + 100 * Math.cos(angle * Math.PI / 180), y + 100 * Math.sin(angle * Math.PI / 180), 0);
                impaler?.applyTimedLife(FourCC('BTLF'), 1.00);
                impaler?.addAbility(FourCC('A030'));
                if(impaler) {
                    impalers.push(impaler);
                }
            });

            impalers.forEach((impaler, index) => {
                const angle = angles[index];
                impaler?.issueOrderAt('impale', x + 150 * Math.cos(angle * Math.PI / 180), y + 150 * Math.sin(angle * Math.PI / 180));
            });
        }
    }

    public GetTickModulo(): number {
        return 49;
    }
}
