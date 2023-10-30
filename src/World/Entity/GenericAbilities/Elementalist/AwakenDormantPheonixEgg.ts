/**
 *  Awaken a dormant pheonix egg
 */
import { GenericAbility } from '../GenericAbility';
import { Defender } from '../../Players/Defender';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Tower } from '../../Tower/Specs/Tower';
import {MapPlayer, Unit} from "w3ts";
import Player from "mdx-m3-viewer-th/dist/cjs/parsers/w3x/w3i/player";


export class AwakenDormantPheonixEgg extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0DV', game);
    }


    public TargetOnEffectAction(): void {
        const triggerUnit: Unit = Unit.fromEvent()!;
        const ownerPlayer: MapPlayer = triggerUnit.getOwner()!;
        const owner: Defender | undefined = this.game.players.get(ownerPlayer.id);

        if (owner) {
            const tower: Tower | undefined = owner.GetTower(triggerUnit.id);
            if (tower) {
                tower.Upgrade(FourCC('h006'));
            }
        }
    }



}
