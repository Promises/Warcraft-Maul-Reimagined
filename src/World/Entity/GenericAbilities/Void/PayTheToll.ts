/**
 *  [Void] PayTheToll
 *  Pay a sum to remove a husk
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import { AntiJuggleTower } from '../../AntiJuggle/AntiJuggleTower';
import {Unit} from "w3ts";
import {DecodeFourCC} from "../../../../lib/translators";
import {SyncTrace} from "../../../../lib/SyncTrace";


// What Pay the Toll costs (its tooltip says so too)
const TOLL = 50;

/** Void husks and Elementalists' Depleted Rocks: pay the toll and the unit is removed. */
export class PayTheToll extends GenericAbility implements AbilityOnCastTargetsUnit {

    constructor(game: WarcraftMaul) {
        super('A0BF', game);
    }

    public TargetOnCastAction(): void {
        const spellAbilityUnit = Unit.fromHandle(GetSpellAbilityUnit())!;
        const owner: Defender | undefined = this.game.players.get(spellAbilityUnit.getOwner()!.id);

        if (owner) {
            const tower = owner.GetTower(spellAbilityUnit.id);
            if (tower && owner.getGold() < TOLL) {
                // Said, and the cast called off before it takes effect: it used to pass in silence
                owner.sendMessage(`Pay the Toll costs ${TOLL} gold`);
                SyncTrace.note('toll', `p${owner.id} refused gold=${owner.getGold()}`);
                spellAbilityUnit.issueImmediateOrder('stop');
                return;
            }
            if (tower) {
                owner.giveGold(-TOLL);
                SyncTrace.note('toll', `p${owner.id} paid type=${DecodeFourCC(tower.GetTypeID())} gold=${owner.getGold()}`);

                if (tower.GetTypeID() === FourCC('h02S')) {
                    owner.SetVoidFragmentTick(owner.GetVoidFragmentTick() - 1);
                }

                if (this.game.worldMap.antiBlock) {
                    this.game.worldMap.antiBlock.CleanUpRemovedConstruction(tower.unit);
                }

                tower.Remove();
            }
        }
    }


}
