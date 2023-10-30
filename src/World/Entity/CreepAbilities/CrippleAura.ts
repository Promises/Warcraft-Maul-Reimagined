import { CreepAbility } from './specs/CreepAbility';
import { AttackActionCreepAbility } from './specs/AttackActionCreepAbility';
import {MapPlayer, Unit} from "w3ts";
import {Util} from "../../../lib/translators";

export class CrippleAura extends CreepAbility implements AttackActionCreepAbility {
    constructor(abilityUnit: Unit) {
        super('A08G', abilityUnit);
    }

    public AttackAction(): void {
        if (!this.game || !this.game.worldMap.gameRoundHandler) {
            return;
        }
        const target: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventTarget;
        const source: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;

        if (target && source) {
            if (UnitHasBuffBJ(source, FourCC('B01C'))) {
                return;
            }
            if (!UnitHasBuffBJ(target, FourCC('B01D'))) {
                return;
            }
            if (Util.RandomInt(1, 100) > 10) {
                return;
            }

            const tempUnit = Unit.create(
                MapPlayer.fromIndex(PLAYER_NEUTRAL_PASSIVE)!,
                FourCC('u008'),
                0.0,
                -5300.0,
                bj_UNIT_FACING);
            tempUnit?.addAbility(FourCC('A06B'));
            tempUnit?.setAbilityLevel(FourCC('A06B'), this.game.worldMap.gameRoundHandler.currentWave + 1);
            tempUnit?.applyTimedLife(FourCC('BTLF'), 1.00)
            tempUnit?.issueTargetOrder('cripple', Unit.fromHandle(source)!);

        }
    }

}
