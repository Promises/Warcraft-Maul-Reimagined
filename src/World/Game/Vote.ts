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
import {SyncTrace} from '../../lib/SyncTrace';
import {votedDifficulty} from './DifficultyVote';
import {AdaptiveDifficultyEngine} from './AdaptiveDifficultyEngine';

// The attacker's slot (the creep owner). A host bot sits here, and only here; no normal player can,
// so settings that come from this slot can never be spoofed by a joiner.
const ATTACKER_SLOT = 13;

// Dev-only marker: what the map read from the attacker-slot handicap, so a solo dev run can confirm
// the decode off-game (CustomMapData on the reading client's machine). Not written in release.
const READ_MARKER = 'WarcraftMaul\\maulbot-read.txt';

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
 * applies the result in the handler, so the outcome is identical everywhere. A vote ends when
 * every player has voted, or else when its time is up.
 */
export class Vote {
    public game: WarcraftMaul;
    private readonly panel: VotePanel;
    private readonly hostPanel: HostSettingsPanel;
    private awaitingHost: Defender | undefined;

    private votedMode: number[] = [];
    private hasVotedMode: boolean[] = [];
    private votedDiff: number[] = [];
    // A vote ends when everyone has voted or its time is up, whichever comes first - once
    private modeVoteOpen: boolean = false;
    private diffVoteOpen: boolean = false;
    public difficulty: number = 0;
    // When set, the difficulty is the adaptive one (host-bot only): the game creates an
    // AdaptiveDifficultyEngine and creeps scale per lane by how the team is doing, not by `difficulty`.
    public scaling: boolean = false;
    // The mode index actually applied (0 Classic, 1 Blitz, as vote-mode), for the settings-final broadcast.
    private finalModeIndex: number = settings.GAME_MODES.CLASSIC;
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
        // The host bot encodes the game settings in the attacker slot's lobby handicap; the engine
        // syncs it to every client, so this reads the same value with no bot present in-game. 100% =
        // nothing set, so the normal flow (host detection / players' vote) runs instead.
        if (this.applyHandicapSettings()) {
            return;
        }
        const host = this.game.hostDetection.detected ? this.game.hostDetection.host : undefined;
        const hostDefender = host ? this.game.players.get(host.id) : undefined;
        if (hostDefender) {
            this.askHost(hostDefender);
        } else {
            this.startModeVote();
        }
    }

    /**
     * The host bot sets the game by the handicap it put on the attacker slot in the lobby. The engine
     * syncs that handicap to every client, so each one reads the same value here with the bot already
     * gone (it leaves at load) and no in-game message needed. Encoding, as `100 - percent`: 1 a
     * players' vote; 2-5 classic at 100/200/300/400%; 6-9 blitz; 10-13 debug. 100% (the lobby default,
     * nothing set) returns false, so the normal flow runs. The handicap is reset to 100% first, so the
     * engine stops scaling the attacker's (NAVY's) creeps by the encoded value. A dev build records a
     * marker so the read can be confirmed off-game. Returns whether host settings were applied.
     *
     * Bit layout (7-bit field, MSB first): bit1 (64) players choose, bit2 (32) blitz (else classic),
     * bit3 (16) difficulty +100, bit4 (8) difficulty +200, bit5 (4) adaptive difficulty (the game
     * adjusts it per lane to how the team does, instead of a flat multiplier - see
     * AdaptiveDifficultyEngine), bits 6-7 (2, 1) reserved.
     */
    private applyHandicapSettings(): boolean {
        const percent: number = R2I(GetPlayerHandicap(Player(ATTACKER_SLOT)!) * 100.00 + 0.50);
        // Reset to 100% before any creep spawns, so the engine does not scale the attacker's (NAVY's)
        // creep HP by the encoded handicap (verified 2026-10-24: a slot-13 unit was 56% HP before
        // this reset, full after - matching an untouched attacker slot).
        SetPlayerHandicap(Player(ATTACKER_SLOT)!, 1.00);
        // See the bit layout above. The no-host default is 100% = 1100100, which has BOTH choose and
        // blitz set - a combination no real setting uses - so choose+blitz is the "nothing set"
        // sentinel and the normal flow runs. (That default also has bit5 set, but the sentinel is
        // caught before bit5 is read, so the stray scaling bit never applies.)
        const choose: boolean = (percent & 64) !== 0;
        const blitz: boolean = (percent & 32) !== 0;
        let mode: number = settings.GAME_MODES.CLASSIC;
        let difficulty: number = 100;
        let vote: boolean = false;
        let scaling: boolean = false;
        let applied: boolean = true;
        if (choose && blitz) {
            applied = false;
        } else if (choose) {
            vote = true;
        } else {
            mode = blitz ? settings.GAME_MODES.BLITZ : settings.GAME_MODES.CLASSIC;
            difficulty = 100 + ((percent & 16) !== 0 ? 100 : 0) + ((percent & 8) !== 0 ? 200 : 0);
            scaling = (percent & 4) !== 0;
        }
        const what: string = !applied ? 'default/none' : vote ? 'a players vote'
            : `mode=${mode} difficulty=${difficulty}${scaling ? ' (scaling)' : ''}`;
        Log.Info(`handicap: slot ${ATTACKER_SLOT} = ${percent}% -> ${what}`);
        Log.flush();
        if (this.game.debugMode) {
            Vote.writeMarker(percent, what);
        }
        if (!applied) {
            return false;
        }
        if (vote) {
            this.startModeVote();
        } else {
            this.applyMode(mode);
            this.applyDifficulty(difficulty, scaling, 'bot');
            this.openRaceSelection();
        }
        return true;
    }

    /** Dev-only: records what the map read from the attacker-slot handicap, to confirm it off-game. */
    private static writeMarker(percent: number, what: string): void {
        PreloadGenClear();
        PreloadGenStart();
        Preload(`handicap ${percent}%: ${what}`);
        PreloadGenEnd(READ_MARKER);
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
        // The difficulty column's last row (index == DIFFICULTIES.length) is Adaptive (Blitz only).
        if (difficultyIndex === settings.DIFFICULTIES.length) {
            this.applyHostChoice(player, mode, settings.DIFFICULTIES[0], true);
        } else if (difficultyIndex >= 0 && difficultyIndex < settings.DIFFICULTIES.length) {
            this.applyHostChoice(player, mode, settings.DIFFICULTIES[difficultyIndex]);
        }
    }

    /**
     * The host's choice of mode and difficulty; ignored from anyone but the host the game waits for.
     * A fixed difficulty is a whole percentage from the lowest to the highest (250 is fine, as a vote
     * can end up there too). With `scaling` the game runs the adaptive difficulty instead, which is
     * Blitz-only. Returns whether it was taken.
     */
    public applyHostChoice(player: Defender, mode: number, difficulty: number, scaling: boolean = false): boolean {
        if (!this.awaitingHost || player.id !== this.awaitingHost.id) {
            return false;
        }
        if (!(mode >= 0 && mode < settings.GAME_MODE_STRINGS.length)) {
            return false;
        }
        if (scaling) {
            if (mode !== settings.GAME_MODES.BLITZ) {
                return false;
            }
        } else if (difficulty !== Math.floor(difficulty)
            || !(difficulty >= settings.DIFFICULTIES[0] && difficulty <= settings.DIFFICULTIES[settings.DIFFICULTIES.length - 1])) {
            return false;
        }
        this.awaitingHost = undefined;
        this.hostPanel.hide(player);
        SendMessage(`${player.getNameWithColour()} set the game mode to ${this.modeName(mode)}${scaling ? ' (Adaptive)' : ''}`);
        this.applyMode(mode);
        this.applyDifficulty(difficulty, scaling, 'host');
        this.openRaceSelection();
        return true;
    }

    /**
     * The host's choice to leave the game to a players' vote - the `-s vote` command, the text form
     * of the panel's vote button (what MaulBot does by default). Ignored from anyone but the host the
     * game waits for; returns whether it was taken.
     */
    public applyHostVote(player: Defender): boolean {
        if (!this.awaitingHost || player.id !== this.awaitingHost.id) {
            return false;
        }
        this.hostChoseVote(player);
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

    /** The mode's name as the vote shows it: Blitz reads "Blitz (Adaptive)", since a Blitz vote is adaptive. */
    private voteModeName(mode: number): string {
        const name: string = settings.GAME_MODE_STRINGS[mode]
            + (mode === settings.GAME_MODES.BLITZ ? ' (Adaptive)' : '');
        return Util.ColourString(settings.GAME_MODE_COLOURS[mode], name);
    }

    private startModeVote(): void {
        for (let i = 0; i < settings.PLAYER_GAME_MODES.length; i++) {
            this.votedMode[i] = 0;
        }
        const labels = settings.PLAYER_GAME_MODES.map(mode => this.voteModeName(mode));
        this.panel.show('Game mode vote', labels, index => this.game.playerSync.send('vote-mode', `${index}`));
        this.modeVoteOpen = true;
        Timer.create().start(VOTE_LENGTH, false, () => this.resolveModeVote());
    }

    private recordModeVote(player: MapPlayer, index: number): void {
        if (this.hasVotedMode[player.id] || index < 0 || index >= this.votedMode.length) {
            return;
        }
        this.hasVotedMode[player.id] = true;
        this.votedMode[index]++;
        this.panel.hide(this.game.players.get(player.id)!);
        SendMessage(`${this.playerName(player)} voted for: ${this.voteModeName(settings.PLAYER_GAME_MODES[index])}`);
        if (this.everyoneVoted(defender => this.hasVotedMode[defender.id])) {
            this.resolveModeVote();
        }
    }

    /** Whether every player has voted: then the vote need not wait for its time. */
    private everyoneVoted(hasVoted: (defender: Defender) => boolean): boolean {
        for (const defender of this.game.players.values()) {
            if (!hasVoted(defender)) {
                return false;
            }
        }
        return true;
    }

    private resolveModeVote(): void {
        if (!this.modeVoteOpen) {
            return;
        }
        this.modeVoteOpen = false;
        let winningMode: number = 0;
        for (let i = 1; i < this.votedMode.length; i++) {
            if (this.votedMode[i] > this.votedMode[winningMode]) {
                winningMode = i;
            }
        }
        const mode = settings.PLAYER_GAME_MODES[winningMode];
        SendMessage(`${this.voteModeName(mode)} won with ${this.votedMode[winningMode]} votes.`);
        SyncTrace.note('vote', `mode=${mode} votes=${this.votedMode[winningMode]}`);
        this.applyMode(mode);

        if (this.finalModeIndex === settings.GAME_MODES.BLITZ) {
            // A Blitz vote is always adaptive: there is no difficulty to vote on (it starts at 160 and
            // adjusts to the team), so apply adaptive and go straight to race selection.
            this.applyDifficulty(settings.DIFFICULTIES[0], true, 'vote');
        } else {
            // Difficulty is voted on while the race selection is already open
            this.startDiffVote();
        }
        this.openRaceSelection();
    }

    private applyMode(mode: number): void {
        if (this.forceBlitz) {
            mode = settings.GAME_MODES.BLITZ;
            SendMessage(`Developer forced gamemode to be: ${this.modeName(mode)}.`);
        }
        this.finalModeIndex = mode;
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
        this.diffVoteOpen = true;
        Timer.create().start(VOTE_LENGTH, false, () => this.resolveDiffVote());
    }

    private recordDiffVote(player: MapPlayer, index: number): void {
        if (this.votedDiff[player.id] || index < 0 || index >= settings.DIFFICULTIES.length) {
            return;
        }
        this.votedDiff[player.id] = settings.DIFFICULTIES[index];
        this.panel.hide(this.game.players.get(player.id)!);
        SendMessage(`${this.playerName(player)} voted for: ${Util.ColourString(settings.DIFFICULTY_COLOURS[index], settings.DIFFICULTY_STRINGS[index])}`);
        if (this.everyoneVoted(defender => this.votedDiff[defender.id] !== undefined)) {
            this.resolveDiffVote();
        }
    }

    private resolveDiffVote(): void {
        if (!this.diffVoteOpen) {
            return;
        }
        this.diffVoteOpen = false;
        const votes: number[] = [];
        for (const player of this.game.players.values()) {
            if (!this.votedDiff[player.id]) {
                this.panel.hide(player);
                SendMessage(`${player.getNameWithColour()} did not vote, their vote will not be counted`);
            } else {
                votes.push(this.votedDiff[player.id]);
            }
        }
        if (votes.length === 0) {
            SendMessage('Nobody voted, difficulty will automatically be set to Normal');
            this.applyDifficulty(settings.DIFFICULTIES[0]);
        } else {
            this.applyDifficulty(votedDifficulty(votes));
        }
        SyncTrace.note('vote', `difficulty=${this.difficulty} votes=${votes.length}`);
    }

    /**
     * Sets the difficulty (a percentage, possibly a blend of the votes) and everything that hangs
     * off it. When `scaling` is set the game instead runs the adaptive difficulty: an engine is
     * created and the stored percentage is only its starting global, for display and the lives rule.
     * Only the host-bot handicap path sets scaling, so vote/host-panel games stay flat.
     */
    private applyDifficulty(difficulty: number, scaling: boolean = false, source: string = 'host'): void {
        this.scaling = scaling;
        if (scaling) {
            // The engine owns the difficulty from here, per lane; the value stored/shown is its
            // starting global, so the lives rule and the host-stat broadcast have a number to use.
            this.game.adaptiveDifficulty = new AdaptiveDifficultyEngine();
            difficulty = this.game.adaptiveDifficulty.globalDifficulty();
            // Tell a host bot this game is adaptive, where it started, and how it was chosen (bot
            // handicap / host panel / a Blitz vote), so its stats separate them (settings-final's
            // difficulty is only this start).
            this.game.playerSync.sendGlobal('difficulty-mode', `adaptive:${difficulty}:${source}`);
            // The tuning this game ran, so its telemetry records which constants produced the curve.
            this.game.playerSync.sendGlobal('adapt-tuning', this.game.adaptiveDifficulty.tuningSummary());
        }
        this.game.scoreBoard = new MultiBoard(this.game, this.finalModeIndex);
        const diffIndex: number = R2I((difficulty - 100.00) / 100.00 + ModuloReal((difficulty - 100.00) / 100.00, 1.00));
        this.difficulty = Math.floor(difficulty);
        // Once, for a host bot's stats: the map build, then the actual mode + difficulty + the wave
        // count to win (35 = Archimonde; waves 36-37 are post-win bonus). What people actually play.
        this.game.playerSync.sendGlobal('version', settings.MAP_VERSION);
        this.game.playerSync.sendGlobal('settings-final', `${this.finalModeIndex}:${diffIndex}:35`);
        const colouredDifficulty = Util.ColourString(settings.DIFFICULTY_COLOURS[diffIndex], settings.DIFFICULTY_STRINGS[diffIndex]);
        // No player handicap: creeps are scaled per unit in Creep (HP, armor, abilities)
        if (this.scaling) {
            SendMessage(`Difficulty: adaptive - starting at ${this.difficulty}% and adjusting to how the team does`);
        } else {
            SendMessage(`Difficulty was set to ${this.difficulty}% (${colouredDifficulty})`);
        }

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

        const boardDifficulty: string = this.scaling
            ? Util.ColourString(settings.DIFFICULTY_COLOURS[diffIndex], `Adaptive ${this.difficulty}%`)
            : `${I2S(R2I(this.difficulty))}% (${colouredDifficulty})`;
        MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 3, boardDifficulty);
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
