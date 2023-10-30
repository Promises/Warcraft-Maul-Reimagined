import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import {Util} from "../../../../../lib/translators";
import {Unit} from "w3ts";

export class StormPandaren extends Tower implements AttackActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        if (u === this.unit.handle) {
            const randomInt: number = Util.RandomInt(1, 6);
            const target = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);
            if (!target) {
                return;
            }
            const tempUnit = Unit.create(this.owner, FourCC('u008'), this.unit.x, this.unit.y, bj_UNIT_FACING);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 3.00);
            switch (randomInt) {
                case 1:
                    tempUnit?.addAbility(FourCC('A078')); // Dazzle
                    tempUnit?.issueOrderAt('clusterrockets', target.x, target.y);
                    break;
                case 2:
                    tempUnit?.addAbility(FourCC('A00F')); // Flame Strike
                    tempUnit?.issueOrderAt('flamestrike', target.x, target.y);
                    break;
                case 3:
                    tempUnit?.addAbility(FourCC('A02N')); // Impale
                    tempUnit?.issueOrderAt('impale', target.x, target.y);
                    break;
                case 4:
                    tempUnit?.addAbility(FourCC('A02M')); // Carrion Swarm
                    tempUnit?.issueOrderAt('carrionswarm', target.x, target.y);
                    break;
                case 5:
                    tempUnit?.addAbility(FourCC('A08P')); // Rain of Fire
                    tempUnit?.issueOrderAt('rainoffire', target.x, target.y);
                    break;
                default:
                    tempUnit?.addAbility(FourCC('A00J')); // Rain of Fire
                    tempUnit?.issueOrderAt('fanofknives', target.x, target.y);
                    break;
            }
        }
    }

}
