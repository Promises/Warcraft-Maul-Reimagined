import {Timer} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {GrayVacancyPanel} from './Ui/GrayVacancyPanel';
import {COLOUR, SendMessage, Util} from '../../lib/translators';
import {COLOUR_CODES} from '../GlobalSettings';

const CLEAR_CHECK_INTERVAL = 1;

/**
 * An open gray lane after its holder left: every remaining player is offered it, the first
 * claim to arrive takes it. Claims travel through PlayerSync, which delivers them in the
 * same order on every client, so two players clicking at once resolve to the same winner
 * everywhere. The winner moves at once when no creeps are in the gray lane, otherwise as
 * soon as it is clear.
 */
export class GrayVacancy {
    private readonly panel: GrayVacancyPanel;
    private readonly clearCheck: Timer = Timer.create();
    private open: boolean = false;
    private claimant: Defender | undefined;

    constructor(private readonly game: WarcraftMaul) {
        this.panel = new GrayVacancyPanel(game, () => game.playerSync.send('gray-claim'));
        game.playerSync.on('gray-claim', player => this.claim(player));
    }

    /**
     * A lane lost its holder (left, kicked, or vacated by a debug command): gray's is offered
     * around. A claimant who leaves before moving gives the lane up again.
     */
    public laneVacated(lane: number, leaver: Defender | undefined): void {
        if (leaver !== undefined && leaver === this.claimant) {
            this.claimant = undefined;
            this.clearCheck.pause();
        }
        if (lane !== COLOUR.GRAY || this.game.gameEnded || this.game.players.size === 0) {
            return;
        }
        this.open = true;
        this.claimant = undefined;
        this.panel.setVisible(true);
        SendMessage(`The ${this.grayName()} lane is open: take it from the panel above the command card`);
    }

    /** Someone holds gray again, by claim or by the -gray command. */
    public close(): void {
        this.open = false;
        this.claimant = undefined;
        this.clearCheck.pause();
        this.panel.setVisible(false);
    }

    private claim(player: Defender): void {
        if (!this.open || this.game.laneHolders.has(COLOUR.GRAY)) {
            return;
        }
        if (this.claimant) {
            player.sendMessage(`${this.claimant.getNameWithColour()} was first to take the ${this.grayName()} lane`);
            return;
        }
        this.claimant = player;
        this.panel.setVisible(false);
        SendMessage(`${player.getNameWithColour()} takes the ${this.grayName()} lane`);
        if (!this.tryMove()) {
            player.sendMessage(`You move as soon as the ${this.grayName()} lane is clear of creeps`);
            this.clearCheck.start(CLEAR_CHECK_INTERVAL, true, () => this.tryMove());
        }
    }

    /** Moves the claimant when gray has no creeps; returns whether they moved. */
    private tryMove(): boolean {
        const player = this.claimant;
        if (!player) {
            this.clearCheck.pause();
            return true;
        }
        if (this.game.laneTransfer.laneHasCreeps(COLOUR.GRAY)) {
            return false;
        }
        this.game.laneTransfer.moveToLane(player, COLOUR.GRAY, true);
        // moveToLane closes the vacancy through Defender.moveToLane once the lane is taken
        if (player.lane !== COLOUR.GRAY) {
            // Refused (e.g. the lane got a holder another way); nothing more to wait for
            this.close();
        }
        return true;
    }

    private grayName(): string {
        return Util.ColourString(COLOUR_CODES[COLOUR.GRAY], Util.COLOUR_NAMES[COLOUR.GRAY]);
    }
}
