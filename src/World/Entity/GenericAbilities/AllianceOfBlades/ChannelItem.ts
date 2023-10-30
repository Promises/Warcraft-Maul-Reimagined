/**
 *  Channel WCItem (Alliance Of Blades)
 *  Give item to another alliance tower
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";
import {Log} from "../../../../lib/Serilog/Serilog";


export class ChannelItem extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A05H', game);
    }

    private allianceTowers: number[] = [
        FourCC('n02T'),
        FourCC('n02X'),
        FourCC('n02V'),
        FourCC('n02U'),
        FourCC('n007'),
        FourCC('n02W'),
        FourCC('n012'),
    ];



    public TargetOnEffectAction(): void {
        const u = Unit.fromEvent();
        if (!u) {
            Log.Error('Unable to get unit for target on effect');
            return;
        }

        const owner: Defender | undefined = this.game.players.get(u.getOwner()!.id);
        if (owner) {
            const tower: Tower | undefined = owner.GetTower(u.id);
            if (tower) {
                const targetUnit = Unit.fromHandle(GetSpellTargetUnit());
                if (targetUnit && this.allianceTowers.includes(targetUnit.typeId)) {
                    const item = tower.unit.getItemInSlot(1);
                    if (item) {
                        targetUnit.addItem(item);
                    }
                }
            }
        }
    }


}
