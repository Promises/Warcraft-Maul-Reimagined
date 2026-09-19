import { AbstractActionButton } from './AbstractActionButton';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../../Entity/Players/Defender';
import { AbstractPlayer } from '../../../Entity/Players/AbstractPlayer';
import {Frame} from "w3ts";

export class ClaimButton extends AbstractActionButton {
    private static Icon: string = 'uiImport\\CommandButtons\\BTNClaim.dds';
    private readonly toolTip: Frame;
    private players: Map<number, AbstractPlayer> = new Map<number, AbstractPlayer>();

    constructor(game: WarcraftMaul, x: number, y: number, size: number, idx: number = 0) {
        super(game, `claimButton${idx}`, ClaimButton.Icon, x, y, size);

        this.toolTip = Frame.createType('FaceFrameTooltip', this.backdropHandle, 0, 'TEXT', '')!;
        this.buttonHandle.setTooltip(this.toolTip);
        this.toolTip.setAbsPoint(FRAMEPOINT_CENTER, x, y + 0.025);
        this.toolTip.setText('Claim all towers in your region');

        for (const player of this.game.players.values()) {
            this.players.set(player.id, player);
        }

        game.playerSync.on('claim', player => player.ClaimTowers());
    }

    public clickAction(): void {
        // Local frame event: claiming changes unit ownership, so it runs on every client via PlayerSync
        this.disable();
        this.game.playerSync.send('claim');
        this.enable();
    }


}
