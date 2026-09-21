import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../../Entity/Players/Defender';
import {AdvancedHoloMaze} from '../../../Holograms/AdvancedHoloMaze';
import {CheckPoint} from '../../../Entity/CheckPoint';
import {AbstractPlayer} from '../../../Entity/Players/AbstractPlayer';
import {MapPlayer,Frame} from "w3ts";

export class ExampleMaze extends AbstractActionButton {
    private static enabledIcon: string = 'uiImport\\CommandButtonsDisabled\\DISBTNMAZEAlpha.dds';
    private static disabledIcon: string = 'uiImport\\CommandButtons\\BTNMAZEAlpha.dds';
    private currentFade: number = 255;
    private defaultSize: number;
    private currentSize: number;
    private increaseFade: boolean = false;
    private players: Map<number, AbstractPlayer> = new Map<number, AbstractPlayer>();

    constructor(game: WarcraftMaul, rail: Frame, offsetX: number, size: number, idx: number = 0) {
        super(game, `mazeButton${idx}`, ExampleMaze.disabledIcon, rail, offsetX, size);
        this.defaultSize = size;
        this.currentSize = (size * 2);
        this.setTooltip('Sample maze', 'Shows or hides the advanced sample maze in your lane.');

        for (const player of this.game.players.values()) {
            this.players.set(player.id, player);
        }

        // this.game.eventQueue.AddLow(() => this.fadeInAndOut());

    }

    public clickAction(): void {
        const player: Defender | undefined = this.game.players.get(MapPlayer.fromEvent()!.id);
        if (!player) {
            return;
        }
        this.disable();
        this.players.delete(player.id);
        this.backdropHandle.setAlpha(255);
        const firstSpawn: CheckPoint | undefined = this.game.worldMap.playerSpawns[player.lane].spawnOne;
        if (firstSpawn === undefined) {
            this.enable();

            return;
        }

        const firstCheckpoint: CheckPoint | undefined = firstSpawn.next;
        if (firstCheckpoint === undefined) {
            this.enable();

            return;
        }

        const secondCheckpoint: CheckPoint | undefined = firstCheckpoint.next;
        if (secondCheckpoint === undefined) {
            this.enable();

            return;
        }

        if (player.holoMaze === undefined) {
            player.setHoloMaze(
                new AdvancedHoloMaze(
                    'ReplaceableTextures\\Splats\\SuggestedPlacementSplat.blp',
                    GetRectCenterX(firstCheckpoint.rectangle),
                    GetRectCenterY(firstCheckpoint.rectangle),
                    GetRectCenterX(secondCheckpoint.rectangle),
                    GetRectCenterY(secondCheckpoint.rectangle)));
            this.setIcon(true);
        } else {
            player.setHoloMaze(undefined);
            this.setIcon(false);
        }
        this.enable();
    }

    public setIcon(enabled: boolean): void {
        const local = GetTriggerPlayer() === GetLocalPlayer();
        if (local) {
            this.backdropHandle.setTexture(enabled ? ExampleMaze.enabledIcon : ExampleMaze.disabledIcon, 0, true);
        }
        this.setOn(enabled, local);
    }

    public fadeInAndOut(): boolean {
        if (this.currentFade >= 250 || this.currentFade <= 10) {
            this.increaseFade = !this.increaseFade;
        }
        if (this.players.size === 0) {
            return true;
        }
        if (this.increaseFade) {
            this.currentFade += 10;
            this.currentSize += (this.defaultSize / 25.0);
        } else {
            this.currentFade -= 10;
            this.currentSize = this.defaultSize;

        }
        for (const player of this.players.values()) {
            if (player.handle === GetLocalPlayer()) {
                this.backdropHandle.setAlpha(this.currentFade);
                this.backdropHandle.setSize(this.currentSize, this.currentSize);
                this.buttonHandle.setSize(this.currentSize, this.currentSize);
            }
        }

        return false;
    }

}
