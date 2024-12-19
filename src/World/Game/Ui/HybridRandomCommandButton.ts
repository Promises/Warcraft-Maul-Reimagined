import {Frame} from "w3ts";
import {Defender} from "../../Entity/Players/Defender";

export class HybridRandomCommandButton {
    private tooltipFrame: Frame | undefined;
    private textFrame: Frame | undefined;

    private _visible: boolean = false;

    private titleTextFrame: Frame | undefined;
    private expandedToolTipTextFrame: Frame | undefined;
    private goldFrameTextFrame: Frame | undefined;
    private buttonFrame: Frame | undefined;

    constructor(commandButtonIndx: number) {
        // Get the game UI as parent
        const gameUI = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
        if (!gameUI) {
            print('NO UI')
            return;
        }


        this.buttonFrame = Frame.createType("heroIconFrame", gameUI, 0, "BACKDROP", "")!;
        this.buttonFrame.setAbsPoint(FRAMEPOINT_TOPLEFT, 0.156, 0.1470);
        this.buttonFrame.setVisible(false)
        this.buttonFrame?.setAllPoints(Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, commandButtonIndx)!)


        const heroIconFrameHover = Frame.createType("heroIconFrameHover", this.buttonFrame, 0, "FRAME", "")!
        heroIconFrameHover.setAllPoints(this.buttonFrame);

        this.tooltipFrame = Frame.create("BoxedText", heroIconFrameHover, 0, 0)!;
        this.tooltipFrame.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, 0.8, 0.1625);
        heroIconFrameHover.setTooltip(this.tooltipFrame);

        this.titleTextFrame = this.tooltipFrame.getChild(0)!;
        this.expandedToolTipTextFrame = this.tooltipFrame.getChild(1)!;
        this.goldFrameTextFrame = this.tooltipFrame.getChild(3)!;
        this.titleTextFrame?.setText('YOu should not see this');
        this.expandedToolTipTextFrame?.setText('This should never be visible');
        this.goldFrameTextFrame?.setText(`666`);

        this.resetHeight();
    }

    public setTower(players: Map<number, Defender>, hybridIndx: number): this {
        let icon = '';
        let tooltip = 'YOu should not see this';
        let tooltipExtended = 'This should never be visible';
        let goldCost: number | string ='666';

        for (const player of players.values()) {
            if(player.hasHybridRandomed && player.isLocal()) {
                icon = player.hybridTowers[hybridIndx].icon || '';
                tooltip = GetLocalizedString(player.hybridTowers[hybridIndx].toolTipBasic || 'YOu should not see this')!;
                tooltipExtended = GetLocalizedString(player.hybridTowers[hybridIndx].toolTipExtended || 'This should never be visible')!;
                goldCost = player.hybridTowers[hybridIndx].goldCost || '666';
            }
        }


        this.buttonFrame?.setTexture(icon, 0, true)
        this.titleTextFrame?.setText(tooltip || '');
        this.expandedToolTipTextFrame?.setText(tooltipExtended || '');
        this.goldFrameTextFrame?.setText(`${goldCost}`);
        this.resetHeight();
        return this;
    }

    private resetHeight() {
        this.titleTextFrame?.setSize(0.28, 0);
        this.expandedToolTipTextFrame?.setSize(0.28, 0);
        this.goldFrameTextFrame?.setSize(0.28, 0);
        const textHeight = this.titleTextFrame?.height || 0;
        const expandedTextHeight = this.expandedToolTipTextFrame?.height || 0;
        const goldHeight = this.goldFrameTextFrame?.height || 0;


        this.tooltipFrame?.setSize(0.29, textHeight + expandedTextHeight + goldHeight + 0.0315)

    }

    public showToolTip(): this {
        this.tooltipFrame?.setVisible(true);
        return this;
    }

    public hideToolTip(): this {
        this.tooltipFrame?.setVisible(false);
        return this;
    }

    public show(): this {
        this.buttonFrame?.setVisible(true);
        this._visible = true;
        return this;
    }

    get visible(): boolean {
        return this._visible;
    }

    public hide(): this {
        this._visible = false;
        this.buttonFrame?.setVisible(false);
        this.tooltipFrame?.setVisible(false);
        return this;
    }

    public destroy(): void {
        this.tooltipFrame?.destroy();
        this.textFrame?.destroy();
        this.titleTextFrame?.destroy();
        this.expandedToolTipTextFrame?.destroy();
        this.goldFrameTextFrame?.destroy();
        this.buttonFrame?.destroy();
        this.tooltipFrame = undefined;
        this.textFrame = undefined;
        this.titleTextFrame = undefined;
        this.expandedToolTipTextFrame = undefined;
        this.goldFrameTextFrame = undefined;
        this.buttonFrame = undefined;
    }
}
