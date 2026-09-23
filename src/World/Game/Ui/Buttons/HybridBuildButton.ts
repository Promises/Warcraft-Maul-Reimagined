import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame} from 'w3ts';

export class HybridBuildButton extends AbstractActionButton {
    private static Icon: string = 'ReplaceableTextures\\CommandButtons\\BTNBasicStruct.blp';
    constructor(game: WarcraftMaul, rail: Frame, offsetX: number, size: number, idx: number = 0) {
        super(game, `hybridBuildButton${idx}`, HybridBuildButton.Icon, rail, offsetX, size);
        this.setTooltip('Hybrid build |cffffcc00(B)|r', 'The nine-tower build menu. Available after hybrid randoming. |cffffcc00-build|r');
        this.setHotkey('B');
    }

    public clickAction(): void {
        // The click fires on every client with the clicking player; the panel toggles for
        // that player everywhere so build-mode handles stay in step (visuals gated inside)
        const player = this.game.players.get(GetPlayerId(GetTriggerPlayer()!));
        if (!player) {
            return;
        }
        this.game.hybridBuildPanel.toggle(player);
    }
}
