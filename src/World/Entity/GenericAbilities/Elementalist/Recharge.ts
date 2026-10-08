/**
 *  Recharge (Elementalist)
 *  A Depleted Rock, for RECHARGE_PRICE gold, becomes an Uncharged Rune again - which can take an
 *  element again (its two offered elements are rolled anew). It replaced Pay the Toll on the rock.
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { RECHARGE, RECHARGE_PRICE } from '../../../Game/Races/ElementalistPrimals';
import {Unit} from "w3ts";
import {SyncTrace} from "../../../../lib/SyncTrace";

const UNCHARGED_RUNE = FourCC('n00A');

export class Recharge extends GenericAbility implements AbilityOnCastTargetsUnit, AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super(RECHARGE, game);
    }

    /** Called off, with a word, before it takes effect when the gold is short. */
    public TargetOnCastAction(): void {
        const caster = Unit.fromHandle(GetSpellAbilityUnit())!;
        const {owner, tower} = this.rock(caster);
        if (owner && tower && owner.getGold() < RECHARGE_PRICE) {
            owner.sendMessage(`Recharge costs ${RECHARGE_PRICE} gold`);
            SyncTrace.note('recharge', `p${owner.id} refused gold=${owner.getGold()}`);
            caster.issueImmediateOrder('stop');
        }
    }

    public TargetOnEffectAction(): void {
        const {owner, tower} = this.rock(Unit.fromEvent()!);
        if (!owner || !tower || owner.getGold() < RECHARGE_PRICE) {
            return;
        }
        owner.giveGold(-RECHARGE_PRICE);
        const rune = tower.Upgrade(UNCHARGED_RUNE);
        SyncTrace.note('recharge', `p${owner.id} recharged id=${SyncTrace.unit(rune.unit)}`);
    }

    private rock(caster: Unit): {owner?: Defender, tower?: Tower} {
        const owner: Defender | undefined = this.game.players.get(caster.getOwner()!.id);
        return {owner, tower: owner?.GetTower(caster.id)};
    }
}
