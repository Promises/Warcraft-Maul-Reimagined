import { AbstractActionButton } from './AbstractActionButton';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../../Entity/Players/Defender';
import { AbstractPlayer } from '../../../Entity/Players/AbstractPlayer';
import {Frame} from "w3ts";

export class ClaimButton extends AbstractActionButton {
    private static Icon: string = 'uiImport\\CommandButtons\\BTNClaim.dds';
    private players: Map<number, AbstractPlayer> = new Map<number, AbstractPlayer>();

    constructor(game: WarcraftMaul, rail: Frame, offsetX: number, size: number, idx: number = 0) {
        super(game, `claimButton${idx}`, ClaimButton.Icon, rail, offsetX, size);
        this.setTooltip('Claim', 'Claims every tower built in your region. |cffffcc00-claim|r');

        for (const player of this.game.players.values()) {
            this.players.set(player.id, player);
        }

        game.playerSync.on('claim', player => player.ClaimTowers());
    }

    public clickAction(): void {
        // The click fires on every client; only the clicker's client sends, and the sync
        // handler claims the towers for that player everywhere
        if (GetTriggerPlayer() !== GetLocalPlayer()) {
            return;
        }
        this.disable();
        this.game.playerSync.send('claim');
        this.enable();
    }


}
