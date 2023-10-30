import { WarcraftMaul } from '../WarcraftMaul';
import {Trigger} from "w3ts";

export class VoidTicker {
    private readonly trig: Trigger;
    private game: WarcraftMaul;

    constructor(game: WarcraftMaul) {
        this.game = game;
        this.trig = Trigger.create();
        this.trig.registerTimerEvent(30, true);
        this.trig.addAction(() => this.TickVoid());
    }

    private TickVoid(): void {
        this.game.players.forEach((player) => {
            player.SetVoidFragments(player.GetVoidFragments() + player.GetVoidFragmentTick());
            if (player.getVoidBuilder()) {
                player.getVoidBuilder()!.mana = player.GetVoidFragments()
            }
            if (player.GetVoidFragments() > 2000) {
                player.SetVoidFragments(2000);
            }
        });

    }
}
