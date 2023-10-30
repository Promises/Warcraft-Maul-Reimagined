import * as settings from '../GlobalSettings';
import {WarcraftMaul} from '../WarcraftMaul';
import {MultiBoard} from './MultiBoard';
import {Log} from '../../lib/Serilog/Serilog';
import {ClassicGameRound} from './ClassicMaul/ClassicGameRound';
import {BlitzGameRound} from './BlitzMaul/BlitzGameRound';
import {AbstractPlayer} from '../Entity/Players/AbstractPlayer';
import {Dialog, DialogButton, MapPlayer, Timer, Trigger} from "w3ts";
import {SendMessage, Util} from "../../lib/translators";

export class Vote {
    public initializeVotesTrigger: Trigger;
    public difficultyVoteTrigger: Trigger;


    public difficultyDialog: Dialog = new Dialog();
    public difficultyButtons: DialogButton[] = [];


    public modeDialog: Dialog = new Dialog();
    public modeButtons: DialogButton[] = [];
    public modeVoteTrigger: Trigger;
    private votedMode: number[] = [];


    public game: WarcraftMaul;
    private votedDiff: number[] = [];
    private totalVotedDiff: number = 0;
    public difficulty: number = 0;
    public forceBlitz: boolean = false;


    constructor(game: WarcraftMaul) {
        this.game = game;
        this.initializeVotesTrigger = Trigger.create();
        this.initializeVotesTrigger.registerTimerEvent(1.00, false);
        this.initializeVotesTrigger.addAction(() => this.InitializeVotes());

        this.difficultyVoteTrigger = Trigger.create();
        this.difficultyVoteTrigger.registerDialogEvent(this.difficultyDialog);
        this.difficultyVoteTrigger.addAction(() => this.DifficultyVote());

        this.modeVoteTrigger = Trigger.create();
        this.modeVoteTrigger.registerDialogEvent(this.modeDialog);
        this.modeVoteTrigger.addAction(() => this.ModeVote());
    }


    public InitializeVotes(): void {
        this.difficultyDialog.setMessage('Difficulty vote:');
        for (let i: number = 0; i < settings.DIFFICULTIES.length; i++) {
            const btn = this.difficultyDialog.addButton(`${Util.ColourString(settings.DIFFICULTY_COLOURS[i],
                `${settings.DIFFICULTIES[i]}% ${settings.DIFFICULTY_STRINGS[i]}`)}`);
            this.difficultyButtons.push(btn!)
        }
        this.modeDialog.setMessage('Game mode vote:');
        for (let i: number = 0; i < settings.GAME_MODE_STRINGS.length; i++) {
            this.votedMode[i] = 0;
            this.modeButtons.push(
                this.modeDialog.addButton(`${Util.ColourString(settings.GAME_MODE_COLOURS[i],
                    `${settings.GAME_MODE_STRINGS[i]}`)}`)!
            );
        }

        for (const player of this.game.players.values()) {
            PanCameraToTimedForPlayer(player.handle, -1900.00, 2100.00, 0.00);
            this.modeDialog.display(player, true);
        }

        // DisableTriggers();
        this.InitializeModeVoteTimer();
    }

    private InitializeModeVoteTimer(): void {
        const t: timer = CreateTimer();
        TimerStart(t, 10.00, false, () => this.ModeVoteTimeExpired());
    }

    private InitializeDiffVoteTimer(): void {
        const t: timer = CreateTimer();
        TimerStart(t, 10.00, false, () => this.VoteDiffTimerExpired());
    }

    private SetDifficulty(diffculty: number): void {
        for (const enemy of this.game.enemies) {
            enemy.handicap = diffculty;
        }
    }

    private ModeVoteTimeExpired(): void {
        const timer = Timer.fromExpired();
        if (timer) {
            timer.pause();
        }
        let winningMode: number | undefined;
        for (let i: number = 0; i < this.votedMode.length; i++) {
            if (!winningMode) {
                winningMode = i;
            } else {
                if (this.votedMode[i] > this.votedMode[winningMode]) {
                    winningMode = i;
                }
            }
        }
        if (!winningMode) {
            Log.Fatal('Could not parse game mode');
            return;
        }
        if (this.forceBlitz) {
            winningMode = 1;
        }

        const colouredMode: string = Util.ColourString(settings.GAME_MODE_COLOURS[winningMode], settings.GAME_MODE_STRINGS[winningMode]);
        if (this.forceBlitz) {
            SendMessage(`Developer forced gamemode to be: ${colouredMode}.`);
        } else {
            SendMessage(`${colouredMode} won with ${this.votedMode[winningMode]} votes.`);

        }
        switch (winningMode) {
            case settings.GAME_MODES.CLASSIC:
                this.game.worldMap.gameRoundHandler = new ClassicGameRound(this.game);
                break;
            case settings.GAME_MODES.BLITZ:
                this.game.worldMap.gameRoundHandler = new BlitzGameRound(this.game);
                break;
            default:
                Log.Fatal('Invalid game mode, defaulting to classic.');
                this.game.worldMap.gameRoundHandler = new ClassicGameRound(this.game);
                break;
        }

        for (const player of this.game.players.values()) {
            this.difficultyDialog.display(player, true)
        }


        this.InitializeDiffVoteTimer();

    }

    private VoteDiffTimerExpired(): void {
        const timer = Timer.fromExpired();
        if (timer) {
            timer.pause();
        }
        let voteCount: number = 0;
        for (const player of this.game.players.values()) {
            if (!this.votedDiff[player.id]) {
                this.difficultyDialog.display(player, false);
                SendMessage(`${player.getNameWithColour()} did not vote, their vote will not be counted`);
            } else {
                voteCount++;
                this.totalVotedDiff += this.votedDiff[player.id];
            }


        }
        this.game.scoreBoard = new MultiBoard(this.game);


        if (voteCount === 0) {
            SendMessage('Nobody voted, difficulty will automatically be set to Normal');
            this.difficulty = settings.DIFFICULTIES[0];

        } else {
            this.difficulty = this.totalVotedDiff / voteCount;
        }


        const diffIndex: number = R2I((this.difficulty - 100.00) / 100.00 + ModuloReal((this.difficulty - 100.00) / 100.00, 1.00));
        this.difficulty = Math.floor(this.difficulty);
        // this.SetDifficulty(this.difficulty);
        const passive = MapPlayer.fromIndex(PLAYER_NEUTRAL_PASSIVE)
        if (passive) {
            passive.handicap = this.difficulty
        }
        // this.game.mmd.DefineSettingNumber('difficulty', this.difficulty);
        SendMessage(`Difficulty was set to ${this.difficulty}% (${Util.ColourString(settings.DIFFICULTY_COLOURS[diffIndex],
            settings.DIFFICULTY_STRINGS[diffIndex])})`);

        for (const player of this.game.players.values()) {
            for (const ally of this.game.players.values()) {
                player.setAlliance(ally, ALLIANCE_HELP_REQUEST, false)
            }
        }

        if (this.difficulty >= 400) {
            settings.Sounds.impossibleDifficultySound.start();
            SendMessage('|cFF565656Everyone voted for Extreme, you will only have |r1|cFF565656 life!|r');
            this.game.gameLives = 1;
            this.game.startLives = 1;
            MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 4, `${this.game.gameLives}%`);
            // MultiboardSetItemValueBJ(udg_Scoreboard, 2, 4, I2S(udg_TotalLives))
            SetWaterBaseColorBJ(100, 20.00, 20.00, 0);
            this.game.worldMap.ReplaceRunedBricksWithLava();
        }

        MultiboardSetItemValueBJ(
            this.game.scoreBoard.board,
            2, 3,
            `${I2S(R2I(this.difficulty))}% (${Util.ColourString(settings.DIFFICULTY_COLOURS[diffIndex],
                settings.DIFFICULTY_STRINGS[diffIndex])})`,
        );


    }

    private DifficultyVote(): void {
        const player = this.game.players.get(MapPlayer.fromEvent()!.id);
        if (!player) {
            return;
        }
        for (let i: number = 0; i < this.difficultyButtons.length; i++) {
            const button: DialogButton = this.difficultyButtons[i];

            if (DialogButton.fromEvent() === button) {
                if (!player) {
                    return;
                }
                this.votedDiff[player.id] = settings.DIFFICULTIES[i];
                SendMessage(`${player.getNameWithColour()} voted for: ${Util.ColourString(settings.DIFFICULTY_COLOURS[i], settings.DIFFICULTY_STRINGS[i])}`);
            }
        }
        this.difficultyDialog.display(player, false);
    }

    private ModeVote(): void {
        const player = this.game.players.get(MapPlayer.fromEvent()!.id);
        if (!player) {
            return;
        }
        for (let i: number = 0; i < this.modeButtons.length; i++) {
            const button: DialogButton = this.modeButtons[i];

            if (DialogButton.fromEvent() === button) {

                this.votedMode[i]++;
                SendMessage(`${player.getNameWithColour()} voted for: ${Util.ColourString(settings.GAME_MODE_COLOURS[i], settings.GAME_MODE_STRINGS[i])}`);
            }
        }
        this.modeDialog.display(player, false);
    }


}
