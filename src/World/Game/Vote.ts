import * as settings from '../GlobalSettings';
import {WarcraftMaul} from '../WarcraftMaul';
import {MultiBoard} from './MultiBoard';
import {Log} from '../../lib/Serilog/Serilog';
import {ClassicGameRound} from './ClassicMaul/ClassicGameRound';
import {BlitzGameRound} from './BlitzMaul/BlitzGameRound';
import {MapPlayer, Timer} from "w3ts";
import {SendMessage, Util} from "../../lib/translators";
import {VotePanel} from './Ui/VotePanel';

/**
 * Mode and difficulty voting. The vote UI is a left-side frame panel (VotePanel) rather than
 * the native modal dialogs, so it never covers the centred race panel. A vote button click is
 * a local frame event, so it sends a sync message; the tally is applied on every client in the
 * sync handler. The two 10s timers resolve each phase deterministically on all clients.
 */
export class Vote {
    public game: WarcraftMaul;
    private readonly panel: VotePanel;

    private votedMode: number[] = [];
    private hasVotedMode: boolean[] = [];
    private votedDiff: number[] = [];
    private totalVotedDiff: number = 0;
    public difficulty: number = 0;
    public forceBlitz: boolean = false;

    constructor(game: WarcraftMaul) {
        this.game = game;
        this.panel = new VotePanel(game);

        game.playerSync.on('vote-mode', (player, data) => this.recordModeVote(player, Number(data)));
        game.playerSync.on('vote-diff', (player, data) => this.recordDiffVote(player, Number(data)));

        const start = Timer.create();
        start.start(1.00, false, () => this.startModeVote());
    }

    private startModeVote(): void {
        for (let i = 0; i < settings.GAME_MODE_STRINGS.length; i++) {
            this.votedMode[i] = 0;
        }
        const labels = settings.GAME_MODE_STRINGS.map((mode, i) => Util.ColourString(settings.GAME_MODE_COLOURS[i], mode));
        this.panel.show('Game mode vote', labels, index => this.game.playerSync.send('vote-mode', `${index}`));
        for (const player of this.game.players.values()) {
            PanCameraToTimedForPlayer(player.handle, -1900.00, 2100.00, 0.00);
        }
        Timer.create().start(10.00, false, () => this.resolveModeVote());
    }

    private recordModeVote(player: MapPlayer, index: number): void {
        if (this.hasVotedMode[player.id] || index < 0 || index >= this.votedMode.length) {
            return;
        }
        this.hasVotedMode[player.id] = true;
        this.votedMode[index]++;
        this.panel.hide(this.game.players.get(player.id)!);
        SendMessage(`${this.playerName(player)} voted for: ${Util.ColourString(settings.GAME_MODE_COLOURS[index], settings.GAME_MODE_STRINGS[index])}`);
    }

    private resolveModeVote(): void {
        let winningMode: number = 0;
        for (let i = 1; i < this.votedMode.length; i++) {
            if (this.votedMode[i] > this.votedMode[winningMode]) {
                winningMode = i;
            }
        }
        if (this.forceBlitz) {
            winningMode = settings.GAME_MODES.BLITZ;
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

        this.startDiffVote();
    }

    private startDiffVote(): void {
        const labels = settings.DIFFICULTIES.map((diff, i) =>
            Util.ColourString(settings.DIFFICULTY_COLOURS[i], `${diff}% ${settings.DIFFICULTY_STRINGS[i]}`));
        this.panel.show('Difficulty vote', labels, index => this.game.playerSync.send('vote-diff', `${index}`));
        Timer.create().start(10.00, false, () => this.resolveDiffVote());
    }

    private recordDiffVote(player: MapPlayer, index: number): void {
        if (this.votedDiff[player.id] || index < 0 || index >= settings.DIFFICULTIES.length) {
            return;
        }
        this.votedDiff[player.id] = settings.DIFFICULTIES[index];
        this.panel.hide(this.game.players.get(player.id)!);
        SendMessage(`${this.playerName(player)} voted for: ${Util.ColourString(settings.DIFFICULTY_COLOURS[index], settings.DIFFICULTY_STRINGS[index])}`);
    }

    private resolveDiffVote(): void {
        let voteCount: number = 0;
        for (const player of this.game.players.values()) {
            if (!this.votedDiff[player.id]) {
                this.panel.hide(player);
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
        // No player handicap: creeps are scaled per unit in Creep (HP, armor, abilities)
        SendMessage(`Difficulty was set to ${this.difficulty}% (${Util.ColourString(settings.DIFFICULTY_COLOURS[diffIndex],
            settings.DIFFICULTY_STRINGS[diffIndex])})`);

        for (const player of this.game.players.values()) {
            for (const ally of this.game.players.values()) {
                player.setAlliance(ally, ALLIANCE_HELP_REQUEST, false);
            }
        }

        if (this.difficulty >= 400) {
            settings.Sounds.impossibleDifficultySound.start();
            SendMessage('|cFF565656Everyone voted for Extreme, you will only have |r1|cFF565656 life!|r');
            this.game.gameLives = 1;
            this.game.startLives = 1;
            MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 4, `${this.game.gameLives}%`);
            SetWaterBaseColorBJ(100, 20.00, 20.00, 0);
            this.game.worldMap.ReplaceRunedBricksWithLava();
        }

        MultiboardSetItemValueBJ(
            this.game.scoreBoard.board,
            2, 3,
            `${I2S(R2I(this.difficulty))}% (${Util.ColourString(settings.DIFFICULTY_COLOURS[diffIndex],
                settings.DIFFICULTY_STRINGS[diffIndex])})`,
        );

        // The race panel can open as soon as voting is done; the panel itself never blocked it
        for (const player of this.game.players.values()) {
            this.game.raceSelectPanel.open(player);
        }
    }

    private playerName(player: MapPlayer): string {
        const defender = this.game.players.get(player.id);
        return defender ? defender.getNameWithColour() : `Player ${player.id}`;
    }
}
