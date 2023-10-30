import { AbstractPlayer } from './AbstractPlayer';
import { WarcraftMaul } from '../../WarcraftMaul';

export class Attacker extends AbstractPlayer {

    constructor(id: number, game: WarcraftMaul) {
        super(id);
        this.name = 'Forces of Darkness';
        this.setState(PLAYER_STATE_GIVES_BOUNTY,1);
        for (const humanPlayer of game.players.values()) {
            SetPlayerAllianceStateBJ(humanPlayer.handle, this.handle, bj_ALLIANCE_UNALLIED);
        }
    }


}
