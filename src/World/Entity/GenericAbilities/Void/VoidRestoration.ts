/**
 *  [Void] Void Restoration (the Void Priest)
 *  Heals a tower bought with void fragments (the ability's own heal) and gives 10 fragments
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { VOID_FRAGMENT_COSTS } from '../../Tower/Races/Void/VoidFragmentCosts';
import {TextTag, Unit} from "w3ts";
import {DecodeFourCC} from "../../../../lib/translators";
import {SyncTrace} from "../../../../lib/SyncTrace";

// The fragments a restoration gives (its tooltip says so too)
const FRAGMENTS = 10;

export class VoidRestoration extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A095', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const spellTargetUnit = Unit.fromHandle(GetSpellTargetUnit());
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);
        if (!owner || !spellTargetUnit) {
            return;
        }
        const tower: Tower | undefined = owner.GetTower(spellAbilityUnit.id);
        const target: Tower | undefined = owner.GetTower(spellTargetUnit.id);
        // Only a tower of the player's own that was bought with fragments, as the tooltip says
        if (!tower || !target || VOID_FRAGMENT_COSTS[DecodeFourCC(target.GetTypeID())] === undefined) {
            owner.sendMessage('Void Restoration works on your own towers bought with void fragments');
            SyncTrace.note('void', `p${owner.id} restoration refused`);
            spellAbilityUnit.issueImmediateOrder('stop');
            return;
        }
        const tt = TextTag.create()!;
        tt.setPos(target.unit.x, target.unit.y, 10);
        tt.setText(GetLocalizedString('TRIGSTR_7924') ?? '', 0.023);
        tt.setColor(255, 255, 255, 255);
        tt.setVelocity(40, 90);
        tt.setPermanent(false);
        tt.setLifespan(4.00);
        tt.setFadepoint(2.00);

        owner.setVoidFragments(owner.GetVoidFragments() + FRAGMENTS);
        SyncTrace.note('void', `p${owner.id} restoration fragments=${owner.GetVoidFragments()}`);
    }
}
