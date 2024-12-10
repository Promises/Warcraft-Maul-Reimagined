import {Frame} from "w3ts";
import {HybridTower} from "../Races/HybridRandom.types";

export class BoxText {
    private tooltipFrame: Frame | undefined;
    private textFrame: Frame | undefined;

    private _visible: boolean = false;

    // private button: Frame | undefined;
    private titleTextFrame: Frame | undefined;
    private expandedToolTipTextFrame: Frame | undefined;
    private goldFrameTextFrame: Frame | undefined;
    private buttonFrame: Frame | undefined;

    constructor(commandButtonIndx: number, hybridTower: HybridTower) {
        // Get the game UI as parent
        const gameUI = Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0);
        if (!gameUI) {
            print('NO UI')
            return;
        }


        this.buttonFrame = Frame.createType("heroIconFrame", gameUI, 0, "BACKDROP", "")!;
        // heroIconFrame.setSize(0.0385, 0.0385)
        this.buttonFrame.setAbsPoint(FRAMEPOINT_TOPLEFT, 0.156, 0.1470);
        this.buttonFrame.setVisible(false)
        // heroIconFrame.setAlpha(0);
        this.buttonFrame?.setAllPoints(Frame.fromOrigin(ORIGIN_FRAME_COMMAND_BUTTON, commandButtonIndx)!)
        this.buttonFrame?.setTexture(hybridTower.icon ? hybridTower.icon : '', 0, true)
        // heroIconFrame.setTexture("ReplaceableTextures\\CommandButtons\\BTNBlackWithEdges.blp", 0, true);


        const heroIconFrameHover = Frame.createType("heroIconFrameHover", this.buttonFrame, 0, "FRAME", "")!
        heroIconFrameHover.setAllPoints(this.buttonFrame);

        this.tooltipFrame = Frame.create("BoxedText", heroIconFrameHover, 0, 0)!;
        this.tooltipFrame.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, 0.8, 0.1625);
        heroIconFrameHover.setTooltip(this.tooltipFrame);

        this.titleTextFrame = this.tooltipFrame.getChild(0)!;
        this.expandedToolTipTextFrame = this.tooltipFrame.getChild(1)!;
        this.goldFrameTextFrame = this.tooltipFrame.getChild(3)!;
        this.titleTextFrame?.setText(GetLocalizedString(hybridTower.toolTipBasic) || '');
        this.expandedToolTipTextFrame?.setText(GetLocalizedString(hybridTower.toolTipExtended) || '');
        this.goldFrameTextFrame?.setText(`${hybridTower.goldCost}`);


        // const child = this.frame.getChild(0)!;
        this.titleTextFrame.setSize(0.28, 0);
        this.expandedToolTipTextFrame.setSize(0.28, 0);
        this.goldFrameTextFrame.setSize(0.28, 0);
        this.tooltipFrame.setSize(0.29, this.titleTextFrame.height + this.expandedToolTipTextFrame.height + this.goldFrameTextFrame.height + 0.0315)

        // this.frame.setVisible(false)
        // Frame.fromName('BoxedTextValue', 0)?.setText('Text!!');
        // Frame.fromName('BoxedTextTitle', 0)?.setText('Title!!');


        // this.button = Frame.createType("MyScriptDialogButton",  gameUI, 0, "GLUETEXTBUTTON", "ScriptDialogButton")!
        // this.button.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, 0.8, 0.8);
        // this.button.setText("MYBTN");

        // this.bg = Frame.create('QuestButtonBaseTemplate', gameUI, 0, 0)!;


        // Create the main frame
        // this.frame = Frame.createType("MyScriptDialogButtonTooltip",  this.bg, 0, "TEXT", "")!


        // this.frame = Frame.create("BoxedText", this.bg, 0, 0)!;
        //
        // print('Mainframe ' + BlzFrameGetName(this.frame?.handle!) + ' ' + this.frame?.childrenCount);
        //
        // this.frame.setSize(0.25, 0);
        //
        // this.bg.setPoint(FRAMEPOINT_BOTTOMLEFT, this.frame, FRAMEPOINT_BOTTOMLEFT, -0.01, -0.01)
        // this.bg.setPoint(FRAMEPOINT_TOPRIGHT, this.frame, FRAMEPOINT_TOPRIGHT, -0.01, -0.01)
        //
        // // this.button.setTooltip(this.bg);
        //
        // // this.frame.setPoint(FRAMEPOINT_BOTTOM, this.button, FRAMEPOINT_TOP, 0, 0.01)
        // this.frame.setAbsPoint(FRAMEPOINT_BOTTOMRIGHT, 0.3, 0.4)
        // this.frame.setEnabled(true);
        // this.frame.setVisible(true);
        //
        // this.frame.setText("Nothing will Happen when you click this Button. But here a longer text. The only son of King Terenas, Arthas is an idealistic, yet somewhat rash, young man who dreams of one day succeeding his father as King of Lordaeron. Arthas became an apprentice paladin at nineteen and has served as a favorite pupil of Uther the Lightbringer ever since. Though Arthas loves the kindly Uther as an uncle, he longs to take command of his own destiny and become a hero like those brave veterans who fought the orcs during the Second War. ")

        // if (!this.frame) {
        //     print('NO FRAME')
        //     return;
        // }
        // ;

        // const topLeftTextFrame = this.frame.getChild(0);
        // const expandedToolTipTextFrame = this.frame.getChild(1);
        // const goldFrameTextFrame = this.frame.getChild(3);
        // const topCenterTextFrame = this.frame.getChild(4);

        // for (let i = 0; i < heroIconFrameTooltip.childrenCount; i++) {
        //     heroIconFrameTooltip.getChild(i)?.setText('CHILD ' + i + '|n|n|n line 2')
        // }
    }

    // public setText(text: string): this {
    //     // this.textFrame?.setText(text);
    //     return this;
    // }
    //
    // public setPosition(x: number, y: number): this {
    //     // this.frame?.setAbsPoint(FRAMEPOINT_CENTER, x, y);
    //     return this;
    // }

    // public setSize(width: number, height: number): this {
    //     // this.frame?.setSize(width, height);
    //     return this;
    // }

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
