import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Defender} from '../../../Entity/Players/Defender';
import {createSampleMaze, SAMPLE_MAZES, sampleMazeIndex} from '../../../Holograms/SampleMazes';
import {AbstractHologramMaze} from '../../../Holograms/AbstractHologramMaze';
import {SyncTrace} from '../../../../lib/SyncTrace';
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
        this.setTooltip('Sample maze', 'Shows a simple sample maze in your lane to get you started; '
            + 'click again to hide it, then build your own.');

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
        this.players.delete(player.id);
        this.backdropHandle.setAlpha(255);
        // Each click shows the next sample maze, simplest first; after the last, none
        const next: number = sampleMazeIndex(player.holoMaze) + 1;
        const maze: AbstractHologramMaze | undefined = next < SAMPLE_MAZES.length
            ? createSampleMaze(this.game, player.lane, next)
            : undefined;
        player.setHoloMaze(maze);
        this.setIcon(maze !== undefined);
        SyncTrace.note('maze', `p${player.id} shows=${maze !== undefined ? next + 1 : 0}`);
        if (maze !== undefined) {
            player.sendMessage('A simple sample maze - a starting point, not the answer. Build your own from here; click again to hide it.');
        }
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
