import {Frame, Trigger, MapPlayer, Unit, Timer} from "w3ts";
import {DecodeFourCC} from "../../../lib/translators";
import {HybridRandomCommandButton} from "./HybridRandomCommandButton";
import {Defender} from "../../Entity/Players/Defender";
import {WarcraftMaul} from "../../WarcraftMaul";

export class HybridRandomUI {

    private commandButtonIndexes = [0, 1, 2, 4, 5, 6, 8, 9, 10];
    private currentSelectedButtonIndex: number | null = null;

    // Fake button to detect visibility
    private hookCommandButtonTooltip: Frame[] = [];


    private hybridFrames: Record<number, HybridRandomCommandButton> = {}

    private timer: Timer;

    constructor(game: WarcraftMaul) {
        for (let i = 0; i < 12; i++) {
            const button = Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, i);
            if (button) {
                const frame = Frame.createType('', button, 0, "SIMPLEFRAME", '');
                // const frame = Frame.createSimple('', button, 0);
                button.setTooltip(frame!);
                frame!.visible = false;
                this.hookCommandButtonTooltip[i] = frame!;
            }
        }

        for (const commandButtonIndex of this.commandButtonIndexes) {
            this.hybridFrames[commandButtonIndex] = new HybridRandomCommandButton(commandButtonIndex);
        }

        this.timer = Timer.create().start(1.0 / 32, true, () => {
            for (const player of game.players.values()) {
                if(player.isLocal() && player.hasHybridRandomed) {
                    this.doTick(player)
                }
            }
        });
    }

    private doTick(player: Defender) {
        if(!(this.isWeeiz())) {
            return;
        }


        let selectedAnything = false;
        let shouldBeVisible = this.areButtonsVisible();

        for (const hybridIndex of this.commandButtonIndexes) {
            const btn = this.hybridFrames[hybridIndex];

            if (btn.visible !== shouldBeVisible) {
                shouldBeVisible ? this.hybridFrames[hybridIndex].show() : this.hybridFrames[hybridIndex].hide();
            }
        }
        // print(`shouldBe: ${shouldBeVisible ? 'visible' : 'hidden'}`);
        if (!shouldBeVisible) {
            if (this.currentSelectedButtonIndex != null) {
                this.hoverCommandButton(null);
            }
            this.currentSelectedButtonIndex = null;
            return;
        }
        // Loop all tooltips and check for the visible one
        for (let i = 0; i < 11; i++) {

            if (this.hookCommandButtonTooltip[i].visible) {
                selectedAnything = true;

                // The new selected is not the same as the current one?
                if (this.currentSelectedButtonIndex !== i) {
                    // print(shouldBeVisible ? 'Visible' : 'Not Visible');
                    this.hoverCommandButton(i);
                }
                this.currentSelectedButtonIndex = i;
            }
        }

        // Now selects nothing?
        if (!selectedAnything && this.currentSelectedButtonIndex != null) {
            this.hoverCommandButton(null);
            this.currentSelectedButtonIndex = null;
        }
    }

    private getCurrentUnit() {
        const detailFrame = Frame.fromName('SimpleInfoPanelUnitDetail', 0)!;
        if (!detailFrame.visible) {
            return null;
        }
        const bottomCenterUI = Frame.fromName('SimpleNameValue', 0)!;
        return bottomCenterUI.text;
    }

    private isWeeiz() {
        const unit = this.getCurrentUnit();
        if (!unit) return false;
        return unit.includes('Weeiz');
    }

    private hoverCommandButton(commandButtonIndex: number | null) {

        print("Hover button " + commandButtonIndex);
        this.hideTooltips(commandButtonIndex)

        if (commandButtonIndex == null) {
            // box?.hideToolTip();
        } else {
            const TT = Frame.fromOrigin(ORIGIN_FRAME_UBERTOOLTIP, 0);
            TT?.setVisible(false)

        }
    }

    private hideTooltips(except?: number | null) {
        for (const hybridIndex of this.commandButtonIndexes) {

            const btn = this.hybridFrames[hybridIndex];
            if(hybridIndex === except) {
                btn.showToolTip();
                continue;
            }
            btn.hideToolTip();
        }
    }

    private areButtonsVisible(): boolean {
        for (let i = 0; i < 12; i++) {
            // Skip indices 3 and 7
            if (i === 3 || i === 7) {
                continue;
            }
            const button = Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, i)!;


            if (!button.visible) {
                return false;
            }
        }
        return true;
    }

    public updateHybridTowers(player: Defender, players: Map<number, Defender>) {
        for (let i = 0; i < player.hybridTowers.length; i++) {
            const renderIndx = this.commandButtonIndexes[i];

            this.hybridFrames[renderIndx].setTower(players, i);
        }
    }

}
