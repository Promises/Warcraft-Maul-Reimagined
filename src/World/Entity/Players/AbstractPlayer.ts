import {COLOUR_CODES} from '../../GlobalSettings';
import {Log} from '../../../lib/Serilog/Serilog';
import {COLOUR, Util} from "../../../lib/translators";
import {MapPlayer} from "../../../lib/player";

export abstract class AbstractPlayer extends MapPlayer {
    private battleTag: string;
    public isDeveloper: boolean = false;

    protected constructor(id: number) {
        super(id);
        // this.wcPlayer = Player(id);
        this.battleTag = this.getPlayerName();

        if (this.battleTag.indexOf('#') > 0) {
            this.name = this.battleTag.slice(0, this.battleTag.indexOf('#'));
            if (this.battleTag === 'Runi95#2202' ||
                this.battleTag === 'Promises#2725' ||
                this.battleTag === 'Arcano#1610' ||
                this.battleTag === 'GenoHacker#2987' ||
                this.battleTag === 'ThaOneSmutje#2560') {
                this.name = `${Util.ColourString('#7ab1df', '[DEV]')} ${this.getNameWithColour()}`;
                this.isDeveloper = true;
            }
        } else {
            this.name = this.battleTag;
        }

    }

    public makeAlliance(otherPlayer: AbstractPlayer): void {
        // SetPlayerAllianceStateAllyBJ
        this.setAlliance(otherPlayer, ALLIANCE_PASSIVE, true);
        this.setAlliance(otherPlayer, ALLIANCE_HELP_REQUEST, true);
        this.setAlliance(otherPlayer, ALLIANCE_HELP_RESPONSE, true);
        this.setAlliance(otherPlayer, ALLIANCE_SHARED_XP, true);
        this.setAlliance(otherPlayer, ALLIANCE_SHARED_SPELLS, true);
        //SetPlayerAllianceStateVisionBJ
        this.setAlliance(otherPlayer, ALLIANCE_SHARED_VISION, true);
        //SetPlayerAllianceStateControlBJ
        this.setAlliance(otherPlayer, ALLIANCE_SHARED_CONTROL, false);
        //SetPlayerAllianceStateFullControlBJ
        this.setAlliance(otherPlayer, ALLIANCE_SHARED_ADVANCED_CONTROL, false);

        // SetPlayerAllianceStateBJ(this.wcPlayer, otherPlayer.wcPlayer, bj_ALLIANCE_ALLIED_VISION);
    }

    public getPlayerColour(): string {
        return COLOUR[this.id].toLowerCase();
    }

    public getColourCode(): string {
        return COLOUR_CODES[this.id];
    }

    public getNameWithColour(): string {
        return Util.ColourString(this.getColourCode(), this.getPlayerName());
    }

    public getPlayerName(): string {
        return this.name;
    }

    public sendMessage(message: string): void {
        Log.Message(`{"s":"${this.getPlayerName()}", "m":"${message}"}`);
        DisplayTimedTextToPlayer(this.handle, 0, 0, 10, message);
    }

    public setGold(amount: number): void {
        this.setState(PLAYER_STATE_RESOURCE_GOLD, amount)
    }

    public setLumber(amount: number): void {
        this.setState(PLAYER_STATE_RESOURCE_LUMBER, amount)
    }

    public giveLumber(amount: number): void {
        this.setLumber(this.getLumber() + amount);
    }

    public giveGold(amount: number): void {
        this.setGold(this.getGold() + amount);
    }

    public getGold(): number {
        return this.getState(PLAYER_STATE_RESOURCE_GOLD);
    }

    public getLumber(): number {
        return this.getState(PLAYER_STATE_RESOURCE_LUMBER);
    }

    public defeatPlayer(): void {
        CustomDefeatBJ(this.handle, 'Defeat!');
    }

}
