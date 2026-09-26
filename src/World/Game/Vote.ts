import * as settings from '../GlobalSettings';
import {WarcraftMaul} from '../WarcraftMaul';
import {MultiBoard} from './MultiBoard';
import {Log} from '../../lib/Serilog/Serilog';
import {ClassicGameRound} from './ClassicMaul/ClassicGameRound';
import {BlitzGameRound} from './BlitzMaul/BlitzGameRound';
import {DebugGameRound} from './DebugMaul/DebugGameRound';
import {MapPlayer, Timer} from "w3ts";
import {SendMessage, Util} from "../../lib/translators";
import {VotePanel} from './Ui/VotePanel';
import {HostSettingsPanel} from './Ui/HostSettingsPanel';
import {Defender} from '../Entity/Players/Defender';

// Host detection answers within a second or two; after this the players vote instead
const HOST_WAIT = 3.00;
// A host who never confirms must not stall the game
const HOST_DECISION_TIMEOUT = 45.00;
const VOTE_LENGTH = 10.00;

/**
 * Game mode and difficulty. When the host is known they choose both on a settings panel and
 * the game goes straight to race selection. Otherwise (no host detected, the host prefers a
 * vote, or the host never answers) the players vote: mode first, then difficulty - with race
 * selection already open, since the difficulty does not change what can be picked.
 *
 * Panel clicks are frame events; the acting client sends a sync message and every client
 * applies the result in the handler, so the outcome is identical everywhere.
 */
export class Vote {
    public game: WarcraftMaul;
    private readonly panel: VotePanel;
    private readonly hostPanel: HostSettingsPanel;
    private awaitingHost: Defender | undefined;

    private votedMode: number[] = [];
    private hasVotedMode: boolean[] = [];
    private votedDiff: number[] = [];
    private totalVotedDiff: number = 0;
    public difficulty: number = 0;
    public forceBlitz: boolean = false;

    constructor(game: WarcraftMaul) {
        this.game = game;
        this.panel = new VotePanel(game);
        this.hostPanel = new HostSettingsPanel(game,
            (mode, difficulty) => game.playerSync.send('game-settings', `${mode}:${difficulty}`),
            () => game.playerSync.send('game-vote'));

        game.playerSync.on('game-settings', (player, data) => this.applyHostSettings(player, data));
        game.playerSync.on('game-vote', player => this.hostChoseVote(player));
        game.playerSync.on('vote-mode', (player, data) => this.recordModeVote(player, Number(data)));
        game.playerSync.on('vote-diff', (player, data) => this.recordDiffVote(player, Number(data)));

        Timer.create().start(HOST_WAIT, false, () => this.begin());
    }

    private begin(): void {
        // Each player starts looking at their own lane (the race shops the camera used to show
        // are gone; races are picked on the panel)
        for (const player of this.game.players.values()) {
            PanCameraToTimedForPlayer(player.handle, player.getCenterX(), player.getCenterY(), 0.00);
        }
        const host = this.game.hostDetection.detected ? this.game.hostDetection.host : undefined;
        const hostDefender = host ? this.game.players.get(host.id) : undefined;
        if (hostDefender) {
            this.askHost(hostDefender);
        } else {
            this.startModeVote();
        }
    }

    private askHost(host: Defender): void {
        this.awaitingHost = host;
        this.hostPanel.show(host);
        SendMessage(`${host.getNameWithColour()} is choosing the game mode and difficulty`);
        Timer.create().start(HOST_DECISION_TIMEOUT, false, () => {
            if (this.awaitingHost) {
                this.hostPanel.hide(this.awaitingHost);
                this.awaitingHost = undefined;
                SendMessage('The host did not choose, the players vote instead');
                this.startModeVote();
            }
        });
    }

    /** The host's choice from their panel, as "mode:difficulty index". */
    private applyHostSettings(player: Defender, data: string): void {
        const [mode, difficultyIndex] = data.split(':').map(value => Number(value));
        if (difficultyIndex >= 0 && difficultyIndex < settings.DIFFICULTIES.length) {
            this.applyHostChoice(player, mode, settings.DIFFICULTIES[difficultyIndex]);
        }
    }

    /**
     * The host's choice of mode and difficulty (a whole percentage from the lowest difficulty to
     * the highest - 250 is fine, as a vote can end up there too); ignored from anyone but the
     * host the game waits for. Returns whether it was taken.
     */
    public applyHostChoice(player: Defender, mode: number, difficulty: number): boolean {
        if (!this.awaitingHost || player.id !== this.awaitingHost.id) {
            return false;
        }
        if (!(mode >= 0 && mode < settings.GAME_MODE_STRINGS.length) || difficulty !== Math.floor(difficulty)
            || !(difficulty >= settings.DIFFICULTIES[0] && difficulty <= settings.DIFFICULTIES[settings.DIFFICULTIES.length - 1])) {
            return false;
        }
        this.awaitingHost = undefined;
        this.hostPanel.hide(player);
        SendMessage(`${player.getNameWithColour()} set the game mode to ${this.modeName(mode)}`);
        this.applyMode(mode);
        this.applyDifficulty(difficulty);
        this.openRaceSelection();
        return true;
    }

    private hostChoseVote(player: Defender): void {
        if (!this.awaitingHost || player.id !== this.awaitingHost.id) {
            return;
        }
        this.awaitingHost = undefined;
        this.hostPanel.hide(player);
        SendMessage(`${player.getNameWithColour()} left the choice to a vote`);
        this.startModeVote();
    }

    private startModeVote(): void {
        for (let i = 0; i < settings.PLAYER_GAME_MODES.length; i++) {
            this.votedMode[i] = 0;
        }
        const labels = settings.PLAYER_GAME_MODES.map(mode => this.modeName(mode));
        this.panel.show('Game mode vote', labels, index => this.game.playerSync.send('vote-mode', `${index}`));
        Timer.create().start(VOTE_LENGTH, false, () => this.resolveModeVote());
    }

    private recordModeVote(player: MapPlayer, index: number): void {
        if (this.hasVotedMode[player.id] || index < 0 || index >= this.votedMode.length) {
            return;
        }
        this.hasVotedMode[player.id] = true;
        this.votedMode[index]++;
        this.panel.hide(this.game.players.get(player.id)!);
        SendMessage(`${this.playerName(player)} voted for: ${this.modeName(settings.PLAYER_GAME_MODES[index])}`);
    }

    private resolveModeVote(): void {
        let winningMode: number = 0;
        for (let i = 1; i < this.votedMode.length; i++) {
            if (this.votedMode[i] > this.votedMode[winningMode]) {
                winningMode = i;
            }
        }
        const mode = settings.PLAYER_GAME_MODES[winningMode];
        SendMessage(`${this.modeName(mode)} won with ${this.votedMode[winningMode]} votes.`);
        this.applyMode(mode);

        // Difficulty is voted on while the race selection is already open
        this.startDiffVote();
        this.openRaceSelection();
    }

    private applyMode(mode: number): void {
        if (this.forceBlitz) {
            mode = settings.GAME_MODES.BLITZ;
            SendMessage(`Developer forced gamemode to be: ${this.modeName(mode)}.`);
        }
        switch (mode) {
            case settings.GAME_MODES.CLASSIC:
                this.game.worldMap.gameRoundHandler = new ClassicGameRound(this.game);
                break;
            case settings.GAME_MODES.BLITZ:
                this.game.worldMap.gameRoundHandler = new BlitzGameRound(this.game);
                break;
            case settings.GAME_MODES.DEBUG:
                this.game.worldMap.gameRoundHandler = new DebugGameRound(this.game);
                break;
            default:
                Log.Fatal('Invalid game mode, defaulting to classic.');
                this.game.worldMap.gameRoundHandler = new ClassicGameRound(this.game);
                break;
        }
    }

    private startDiffVote(): void {
        const labels = settings.DIFFICULTIES.map((diff, i) =>
            Util.ColourString(settings.DIFFICULTY_COLOURS[i], `${diff}% ${settings.DIFFICULTY_STRINGS[i]}`));
        this.panel.show('Difficulty vote', labels, index => this.game.playerSync.send('vote-diff', `${index}`));
        Timer.create().start(VOTE_LENGTH, false, () => this.resolveDiffVote());
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
        if (voteCount === 0) {
            SendMessage('Nobody voted, difficulty will automatically be set to Normal');
            this.applyDifficulty(settings.DIFFICULTIES[0]);
        } else {
            this.applyDifficulty(this.totalVotedDiff / voteCount);
        }
    }

    /** Sets the difficulty (a percentage, possibly a vote average) and everything that hangs off it. */
    private applyDifficulty(difficulty: number): void {
        this.game.scoreBoard = new MultiBoard(this.game);
        const diffIndex: number = R2I((difficulty - 100.00) / 100.00 + ModuloReal((difficulty - 100.00) / 100.00, 1.00));
        this.difficulty = Math.floor(difficulty);
        const colouredDifficulty = Util.ColourString(settings.DIFFICULTY_COLOURS[diffIndex], settings.DIFFICULTY_STRINGS[diffIndex]);
        // No player handicap: creeps are scaled per unit in Creep (HP, armor, abilities)
        SendMessage(`Difficulty was set to ${this.difficulty}% (${colouredDifficulty})`);

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

        MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 3, `${I2S(R2I(this.difficulty))}% (${colouredDifficulty})`);
    }

    private openRaceSelection(): void {
        for (const player of this.game.players.values()) {
            this.game.raceSelectPanel.open(player);
        }
    }

    private modeName(mode: number): string {
        return Util.ColourString(settings.GAME_MODE_COLOURS[mode], settings.GAME_MODE_STRINGS[mode]);
    }

    private playerName(player: MapPlayer): string {
        const defender = this.game.players.get(player.id);
        return defender ? defender.getNameWithColour() : `Player ${player.id}`;
    }
}
