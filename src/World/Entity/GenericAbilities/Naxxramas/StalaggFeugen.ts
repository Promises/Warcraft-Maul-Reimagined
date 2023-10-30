/**
 *  Construct Thaddius (Naxxramas)
 *  Combines Stalagg and Feugen to Thaddius
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";


export class ConstructThaddius extends GenericAbility implements AbilityOnEffectTargetsUnit {
    constructor(game: WarcraftMaul) {
        super('A0F5', game);
    }

    public TargetOnEffectAction(): void {
        const sourceUnit = Unit.fromEvent()!;
        const targetUnit = Unit.fromHandle(GetSpellTargetUnit())!;
        const owner: Defender | undefined = this.game.players.get(sourceUnit.getOwner()!.id);

        if (owner) {
            const sourceTower: Tower | undefined = owner.GetTower(sourceUnit.id);
            const targetTower: Tower | undefined = owner.GetTower(targetUnit.id);

            if (sourceTower && targetTower) {
                if ((sourceTower.GetTypeID() === FourCC('oC7D') && targetTower.GetTypeID() === FourCC('oC7E')) ||
                    (sourceTower.GetTypeID() === FourCC('oC7E') && targetTower.GetTypeID() === FourCC('oC7D'))) {
                    sourceTower.Upgrade(FourCC('oC7F'));
                    const newTower: Tower | undefined = targetTower.Upgrade(FourCC('oC76'));
                    if (newTower !== undefined) {
                        newTower.towerValue = 8;
                    }
                }
            }
        }
    }



}
