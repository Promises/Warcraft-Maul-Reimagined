import {Tower} from '../../Specs/Tower';
import {GenericAutoAttackTower} from '../../Specs/GenericAutoAttackTower';
import {AttackActionTower} from '../../Specs/AttackActionTower';
import {Defender} from '../../../Players/Defender';
import {WarcraftMaul} from '../../../../WarcraftMaul';
import {SellActionTower} from '../../Specs/SellActionTower';
import {Unit} from "w3ts";
import {Util} from "../../../../../lib/translators";

export class VoidFissure extends Tower implements GenericAutoAttackTower, AttackActionTower, SellActionTower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        this.owner.SetVoidFragmentTick(this.owner.GetVoidFragmentTick() + 50);
    }

    public GenericAttack(): void {
        IssueImmediateOrderBJ(GetAttacker()!, 'roar');
    }


    public SellAction(): void {
        this.owner.SetVoidFragmentTick(this.owner.GetVoidFragmentTick() - 50);

    }

    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target = Unit.fromHandle(this.game.gameDamageEngineGlobals.udg_DamageEventTarget);

        if (u === this.unit.handle && target) {
            const rndSpell: number = Util.RandomInt(1, 4);
            const x: number = this.unit.x;
            const y: number = this.unit.y;
            const dummy = Unit.create(this.owner, FourCC('u008'), x, y, bj_UNIT_FACING);
            dummy?.applyTimedLife(FourCC('BTLF'), 3.00);
            switch (rndSpell) {
                case 1:
                    dummy?.addAbility(FourCC('A09I'))
                    dummy?.issueOrderAt('blizzard', x, y)
                    break;
                case 2:
                    dummy?.addAbility(FourCC('A09N'))
                    dummy?.issueOrderAt('flamestrike', x, y)
                    break;
                case 3:
                    dummy?.addAbility(FourCC('A09K'))
                    dummy?.issueOrderAt('monsoon', x, y)
                    break;
                case 4:
                    dummy?.addAbility(FourCC('A09J'))
                    dummy?.issueOrderAt('rainoffire', x, y)
                    break;
            }


        }
    }

}
