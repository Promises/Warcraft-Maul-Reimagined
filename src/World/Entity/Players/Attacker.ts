import { AbstractPlayer } from './AbstractPlayer';
import { WarcraftMaul } from '../../WarcraftMaul';

export class Attacker extends AbstractPlayer {

    constructor(id: number, game: WarcraftMaul) {
        super(id);
        this.name = 'Forces of Darkness';
        // Engine bounty OFF: the map rolls and splits each creep's gold itself (60% to the
        // spawn-lane holder, 40% to the killer) in SpawnedCreeps.RemoveDeadCreeps via CreepBounty.
        this.setState(PLAYER_STATE_GIVES_BOUNTY,0);
        for (const humanPlayer of game.players.values()) {
            SetPlayerAllianceStateBJ(humanPlayer.handle, this.handle, bj_ALLIANCE_UNALLIED);
        }
    }


}
