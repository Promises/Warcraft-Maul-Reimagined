import {ClassicGameRound} from '../ClassicMaul/ClassicGameRound';
import {WarcraftMaul} from '../../WarcraftMaul';
import {Util} from '../../../lib/translators';

/**
 * Debug: the classic game without wave progression, for automated tests and a host bot, which
 * set it with the settings command (-s debug); it is on no panel and in no vote. No wave comes on
 * its own: one starts only when a player asks for it (-start, or the debug -time), and when
 * it is over the game stays on that wave - no next wave, no reward, no win. The towers'
 * end-of-round actions still run.
 */
export class DebugGameRound extends ClassicGameRound {

    constructor(game: WarcraftMaul) {
        super(game);
        this.game.waveTimer = 0;
        this.ShowClock();
    }

    /** Starts the current wave (at the clock's next tick); false when one is already coming. */
    public StartWave(): boolean {
        if (this.isWaveInProgress || this.game.waveTimer > 0) {
            return false;
        }
        // Spawning waits between rows (TriggerSleepAction), which only the game clock's thread
        // may do - so the wave starts on the clock's next tick, as in the classic game
        this.game.waveTimer = 1;
        this.ShowClock();
        return true;
    }

    public GameTimeUpdateEvent(): void {
        if (!this.isWaveInProgress && this.game.waveTimer > 0) {
            this.game.waveTimer = this.game.waveTimer - 1;
            if (this.game.waveTimer === 0) {
                this.isWaveInProgress = true;
                this.SpawnCreeps();
            }
        }
        this.ShowClock();
    }

    protected RoundEnd(): void {
        // Creep players' food runs out whenever their last unit goes, wave or not
        if (!this.isWaveInProgress) {
            return;
        }
        this.isWaveInProgress = false;
        this.game.worldMap.HealEverythingOnMap();
        for (const tower of this.game.worldMap.gameTurn.EndOfRoundTowers()) {
            tower.EndOfRoundAction();
        }
        for (const maze of this.game.worldMap.playerMazes) {
            maze.CleanAll();
        }
    }

    private ShowClock(): void {
        const board = this.game.scoreBoard;
        if (!board) {
            return;
        }
        if (this.isWaveInProgress) {
            MultiboardSetItemValueBJ(board.board, 1, 1, 'Game Time');
            MultiboardSetItemValueBJ(board.board, 2, 1, this.game.PrettifyGameTime(this.game.gameTime));
        } else if (this.game.waveTimer > 0) {
            MultiboardSetItemValueBJ(board.board, 1, 1, 'Starting in');
            MultiboardSetItemValueBJ(board.board, 2, 1, Util.ColourString('#999999', `${this.game.waveTimer}`));
        } else {
            MultiboardSetItemValueBJ(board.board, 1, 1, 'Next wave');
            MultiboardSetItemValueBJ(board.board, 2, 1, Util.ColourString('#999999', '-start'));
        }
    }
}
