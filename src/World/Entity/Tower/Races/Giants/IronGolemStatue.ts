import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import {Unit} from "w3ts";

export class IronGolemStatue extends Tower implements TickingTower {

    public Action(): void {
        if (this.game.worldMap.gameRoundHandler && this.game.worldMap.gameRoundHandler.isWaveInProgress) {

            const x: number = this.unit.x;
            const y: number = this.unit.y;
            const impalers: Unit[] = [];

            // Each impaler spawns at one angle and drives its spikes toward another: the four
            // diagonal ones a quarter turn on (135 -> 45, 225 -> 135, ...), so the spikes cross
            // the tower's surroundings instead of just pointing outward; the axis ones straight.
            const angles = [135, 225, 315, 45, 0, 90, 180, 270];
            const targetAngles = [45, 135, 225, 315, 0, 90, 180, 270];

            angles.forEach((angle) => {
                const impaler = Unit.create(this.owner, FourCC('u008'), x + 100 * Math.cos(angle * Math.PI / 180), y + 100 * Math.sin(angle * Math.PI / 180), 0);
                impaler?.applyTimedLife(FourCC('BTLF'), 1.00);
                impaler?.addAbility(FourCC('A030'));
                if(impaler) {
                    impalers.push(impaler);
                }
            });

            impalers.forEach((impaler, index) => {
                const angle = targetAngles[index];
                impaler.issueOrderAt('impale', x + 150 * Math.cos(angle * Math.PI / 180), y + 150 * Math.sin(angle * Math.PI / 180));
            });
        }
    }

    public GetTickModulo(): number {
        return 49;
    }
}
