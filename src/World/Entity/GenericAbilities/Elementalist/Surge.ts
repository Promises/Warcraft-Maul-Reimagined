/**
 *  Surge (Elementalist Primals)
 *  Buys a Primal one level of Attunement, up to SURGE_LIMIT over its life and never past the cap
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { AttunedTower, SURGE_LIMIT, SURGE_PRICE } from '../../Tower/Specs/AttunedTower';
import { SURGE } from '../../../Game/Races/ElementalistPrimals';
import {Unit} from "w3ts";
import {DecodeFourCC} from "../../../../lib/translators";
import {SyncTrace} from "../../../../lib/SyncTrace";

export class Surge extends GenericAbility implements AbilityOnCastTargetsUnit, AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super(SURGE, game);
    }

    /** Called off, with a word, before it takes effect when no level can be bought. */
    public TargetOnCastAction(): void {
        const caster = Unit.fromHandle(GetSpellAbilityUnit())!;
        const {owner, refusal} = this.check(caster);
        if (owner && refusal) {
            owner.sendMessage(refusal);
            SyncTrace.note('surge', `p${owner.id} refused ${refusal}`);
            caster.issueImmediateOrder('stop');
        }
    }

    public TargetOnEffectAction(): void {
        const {owner, tower, refusal} = this.check(Unit.fromEvent()!);
        if (!owner || !tower || refusal) {
            return;
        }
        owner.giveGold(-SURGE_PRICE);
        tower.surge();
        SyncTrace.note('surge', `p${owner.id} attunement=${tower.attunement} surged=${tower.surged}`);
    }

    private check(caster: Unit): {owner?: Defender, tower?: AttunedTower, refusal?: string} {
        const owner: Defender | undefined = this.game.players.get(caster.getOwner()!.id);
        const tower = owner?.GetTower(caster.id);
        if (!owner || !(tower instanceof AttunedTower)) {
            return {};
        }
        let refusal: string | undefined;
        if (!this.game.abilityHandler.elementalistSettings.GetAscension(DecodeFourCC(tower.GetTypeID()))) {
            refusal = 'Only a Primal can Surge';
        } else if (!tower.canSurge()) {
            refusal = tower.surged >= SURGE_LIMIT ? `Surge buys ${SURGE_LIMIT} levels at most` : 'Attunement is full';
        } else if (owner.getGold() < SURGE_PRICE) {
            refusal = `Surge costs ${SURGE_PRICE} gold`;
        }
        return {owner, tower, refusal};
    }
}
