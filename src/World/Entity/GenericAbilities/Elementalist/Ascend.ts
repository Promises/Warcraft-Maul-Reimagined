/**
 *  Ascend (Elementalist Primals)
 *  A Primal at Attunement 15 becomes its Ascended form, for a fee; one of each per player
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { AttunedTower, ATTUNEMENT_CAP } from '../../Tower/Specs/AttunedTower';
import { ASCEND } from '../../../Game/Races/ElementalistPrimals';
import {Unit} from "w3ts";
import {DecodeFourCC} from "../../../../lib/translators";
import {SyncTrace} from "../../../../lib/SyncTrace";

export class Ascend extends GenericAbility implements AbilityOnCastTargetsUnit, AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super(ASCEND, game);
    }

    /** Called off, with a word, before it takes effect when the Primal may not ascend. */
    public TargetOnCastAction(): void {
        const caster = Unit.fromHandle(GetSpellAbilityUnit())!;
        const {owner, refusal} = this.check(caster);
        if (owner && refusal) {
            owner.sendMessage(refusal);
            SyncTrace.note('ascend', `p${owner.id} refused ${refusal}`);
            caster.issueImmediateOrder('stop');
        }
    }

    public TargetOnEffectAction(): void {
        const {owner, tower, ascended, fee, refusal} = this.check(Unit.fromEvent()!);
        if (!owner || !tower || !ascended || refusal) {
            return;
        }
        owner.giveGold(-fee);
        const made = tower.Upgrade(FourCC(ascended));
        SyncTrace.note('ascend', `p${owner.id} made ${ascended} fee=${fee} damage=${made.unit.getBaseDamage(0)}`);
    }

    private check(caster: Unit): {owner?: Defender, tower?: AttunedTower, ascended?: string, fee: number, refusal?: string} {
        const owner: Defender | undefined = this.game.players.get(caster.getOwner()!.id);
        const tower = owner?.GetTower(caster.id);
        if (!owner || !(tower instanceof AttunedTower)) {
            return {fee: 0};
        }
        const settings = this.game.abilityHandler.elementalistSettings;
        const ascension = settings.GetAscension(DecodeFourCC(tower.GetTypeID()));
        if (!ascension) {
            return {owner, fee: 0, refusal: 'Only a Primal can ascend'};
        }
        const {ascended, fee} = ascension;
        const limit = settings.GetLimit(ascended);
        const have = owner.towersArray.filter(t => DecodeFourCC(t.GetTypeID()) === ascended).length;
        let refusal: string | undefined;
        if (tower.attunement < ATTUNEMENT_CAP) {
            refusal = `Ascension needs Attunement ${ATTUNEMENT_CAP}; this has ${tower.attunement}`;
        } else if (limit !== undefined && have >= limit) {
            refusal = `You may have ${limit} of these`;
        } else if (owner.getGold() < fee) {
            refusal = `Ascension costs ${fee} gold`;
        }
        return {owner, tower, ascended, fee, refusal};
    }
}
