/**
 *  Siphon Energy (Elementalist)
 *  Combines two runes to one tower, and two mature pieces to a Primal (for a fee)
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";
import {DecodeFourCC} from "../../../../lib/translators";
import {SyncTrace} from "../../../../lib/SyncTrace";


export class SiphonEnergy extends GenericAbility implements AbilityOnEffectTargetsUnit, AbilityOnCastTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0CT', game);
    }

    /** A fusion with a fee is called off, with a word, before it takes effect when the gold is short. */
    public TargetOnCastAction(): void {
        const pair = this.pair(Unit.fromHandle(GetSpellAbilityUnit())!, Unit.fromHandle(GetSpellTargetUnit())!);
        if (!pair) {
            return;
        }
        const {owner, combination, fee} = pair;
        const limit = this.game.abilityHandler.elementalistSettings.GetLimit(combination);
        const have = owner.towersArray.filter(tower => DecodeFourCC(tower.GetTypeID()) === combination).length;
        let refusal: string | undefined;
        if (limit !== undefined && have >= limit) {
            refusal = `You may have ${limit} of these`;
        } else if (owner.getGold() < fee) {
            refusal = `This fusion costs ${fee} gold`;
        }
        if (refusal !== undefined) {
            owner.sendMessage(refusal);
            SyncTrace.note('siphon', `p${owner.id} refused ${combination} fee=${fee} gold=${owner.getGold()} have=${have}`);
            Unit.fromHandle(GetSpellAbilityUnit())!.issueImmediateOrder('stop');
        }
    }

    public TargetOnEffectAction(): void {
        const pair = this.pair(Unit.fromEvent()!, Unit.fromHandle(GetSpellTargetUnit())!);
        if (!pair) {
            return;
        }
        const {owner, source, target, combination, fee} = pair;
        const limit = this.game.abilityHandler.elementalistSettings.GetLimit(combination);
        const have = owner.towersArray.filter(tower => DecodeFourCC(tower.GetTypeID()) === combination).length;
        if (owner.getGold() < fee || (limit !== undefined && have >= limit)) {
            return;
        }
        owner.giveGold(-fee);
        // The fusion takes what both ingredients grew: the caster's through Upgrade, the target's here,
        // before the target turns to rock
        const targetCarried = target.carry();
        const fused = source.Upgrade(FourCC(combination));
        fused.receive(targetCarried);
        target.Upgrade(FourCC('n027'));
        SyncTrace.note('siphon', `p${owner.id} made ${combination} fee=${fee} damage=${fused.unit.getBaseDamage(0)}`);
    }

    /** The two towers of a fusion that exists, and what it makes and costs. */
    private pair(caster: Unit, targetUnit: Unit): {owner: Defender, source: Tower, target: Tower, combination: string, fee: number} | undefined {
        const owner: Defender | undefined = this.game.players.get(caster.getOwner()!.id);
        if (!owner) {
            return undefined;
        }
        const source: Tower | undefined = owner.GetTower(caster.id);
        const target: Tower | undefined = owner.GetTower(targetUnit.id);
        if (!source || !target) {
            return undefined;
        }
        const settings = this.game.abilityHandler.elementalistSettings;
        const sourceTypeID = DecodeFourCC(source.GetTypeID());
        const targetTypeID = DecodeFourCC(target.GetTypeID());
        if (!settings.HasCombination(sourceTypeID, targetTypeID)) {
            return undefined;
        }
        const combination = settings.GetCombination(sourceTypeID, targetTypeID);
        if (combination === '') {
            return undefined;
        }
        return {owner, source, target, combination, fee: settings.GetFee(sourceTypeID, targetTypeID)};
    }
}
