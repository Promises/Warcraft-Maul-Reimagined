import {Frame, MapPlayer, Trigger} from 'w3ts';

/**
 * How custom frames are built (the same approach as scourge-survival):
 *
 * - Every panel hangs off uiRoot(). Children of the world frame draw under HP bars and the
 *   console art; children of the game UI origin draw over the chat, message log and ESC menu.
 *   ConsoleUIBackdrop sits in between: above the world, below the game's own dialogs.
 * - Only a panel's root gets an absolute point; everything in it is placed relative to its
 *   parent with setPoint, so a panel moves as one.
 * - Draw order comes from the tree, not from setLevel: a child always draws over its parent.
 *   An icon button is an icon BACKDROP with the BUTTON as its child on top, so the button's
 *   hover glow draws over the icon and the button alone decides the hit area.
 * - TEXT frames are disabled. An enabled TEXT takes mouse input, so a label or tooltip over
 *   a button steals the hover from it (flicker, a tooltip hiding and showing again).
 * - Never register FRAMEEVENT_MOUSE_ENTER/LEAVE, see UiPress.
 */

const TOOLTIP_PADDING = 0.008;
const TOOLTIP_GAP = 0.012;
// A tooltip covers the frames above its owner; its own level keeps it drawn over them
const TOOLTIP_LEVEL = 20;

let root: Frame | undefined;
let messages: Frame | undefined;

/**
 * Game messages (DisplayTextToPlayer) are drawn by ORIGIN_FRAME_UNIT_MSG over everything on
 * ConsoleUIBackdrop, and neither its parent nor its level changes that. So that frame is
 * hidden and GameMessages draws the messages in a text frame of ours instead: created first,
 * on a lower level than the layer that holds every panel.
 */
function build(): void {
    const console = Frame.fromName('ConsoleUIBackdrop', 0) ?? Frame.fromOrigin(ORIGIN_FRAME_GAME_UI, 0)!;
    Frame.fromOrigin(ORIGIN_FRAME_UNIT_MSG, 0)?.setVisible(false);

    // CustomGameMessageText (war3mapImported\ui\CustomTextButton.fdf): left/bottom-justified with a shadow
    messages = Frame.create('CustomGameMessageText', console, 0, 0)!;
    messages.enabled = false;
    messages.setLevel(0);

    root = Frame.createType('customUiLayer', console, 0, 'FRAME', '')!;
    root.setLevel(1);
}

/** The parent of all custom UI. */
export function uiRoot(): Frame {
    if (!root) {
        build();
    }
    return root!;
}

/** The text frame game messages are shown in, below every panel; see GameMessages. */
export function messageText(): Frame {
    if (!messages) {
        build();
    }
    return messages!;
}

/** A tooltip-style boxed panel on the UI root, placed absolutely; hidden until shown. */
export function createPanel(name: string, width: number, height: number): Frame {
    const panel = Frame.createType(name, uiRoot(), 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
    panel.setSize(width, height);
    panel.setVisible(false);
    return panel;
}

/** A plain textured backdrop; takes no mouse input. */
export function createBackdrop(name: string, parent: Frame, texture: string): Frame {
    const backdrop = Frame.createType(name, parent, 0, 'BACKDROP', '')!;
    backdrop.setTexture(texture, 0, true);
    return backdrop;
}

/** A label that never takes mouse input. */
export function createText(name: string, parent: Frame, text: string = '',
                           vertical: textaligntype = TEXT_JUSTIFY_MIDDLE,
                           horizontal: textaligntype = TEXT_JUSTIFY_CENTER): Frame {
    const label = Frame.createType(name, parent, 0, 'TEXT', '')!;
    label.enabled = false;
    BlzFrameSetTextAlignment(label.handle, vertical, horizontal);
    label.setText(text);
    return label;
}

/** A labelled ESC-menu button (CustomTextButton from war3mapImported\ui\CustomTextButton.fdf). */
export function createTextButton(parent: Frame, text: string, width: number, height: number): Frame {
    const button = Frame.create('CustomTextButton', parent, 0, 0)!;
    button.setSize(width, height);
    button.setText(text);
    return button;
}

/**
 * Runs a handler on a button click. The click event fires on every client with the clicking
 * player, so the handler runs everywhere; the clicker's client also drops the button's
 * keyboard focus so it does not swallow hotkeys (only there: toggling the button on another
 * client would reset that player's hover on it).
 */
export function onClick(button: Frame, handler: (this: void, player: MapPlayer) => void): void {
    const trigger = Trigger.create();
    trigger.triggerRegisterFrameEvent(button, FRAMEEVENT_CONTROL_CLICK);
    trigger.addAction(() => {
        const player = MapPlayer.fromEvent()!;
        if (player.handle === GetLocalPlayer()) {
            button.setEnabled(false);
            button.setEnabled(true);
        }
        handler(player);
    });
}

/** A click handler for the clicker's own client only: local view changes and sync sends. */
export function onLocalClick(button: Frame, handler: (this: void) => void): void {
    onClick(button, player => {
        if (player.handle === GetLocalPlayer()) {
            handler();
        }
    });
}

/**
 * A boxed tooltip the engine shows while its owner is hovered. The box wraps one text frame
 * whose height follows its content, so the box always fits whatever text is set.
 */
export class Tooltip {
    private readonly box: Frame;
    private readonly text: Frame;

    constructor(name: string, owner: Frame, width: number, anchor: Frame = owner) {
        this.box = Frame.createType(`${name}Tooltip`, owner, 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
        this.text = createText(`${name}TooltipText`, this.box, '', TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_LEFT);
        // Height 0: the text grows with its content and the box follows it
        this.text.setSize(width - 2 * TOOLTIP_PADDING, 0);
        this.text.setPoint(FRAMEPOINT_BOTTOM, anchor, FRAMEPOINT_TOP, 0, TOOLTIP_GAP);
        this.box.setPoint(FRAMEPOINT_BOTTOMLEFT, this.text, FRAMEPOINT_BOTTOMLEFT, -TOOLTIP_PADDING, -TOOLTIP_PADDING);
        this.box.setPoint(FRAMEPOINT_TOPRIGHT, this.text, FRAMEPOINT_TOPRIGHT, TOOLTIP_PADDING, TOOLTIP_PADDING);
        this.box.setLevel(TOOLTIP_LEVEL);
        owner.setTooltip(this.box);
    }

    /** Title, description and an optional gold cost; call it for the local player only if they differ per player. */
    public setText(title: string, description: string, goldCost?: number): void {
        let text = `${title}|n|n${description}`;
        if (goldCost !== undefined) {
            text += `|n|n|cffffcc00Cost: ${goldCost} gold|r`;
        }
        this.text.setText(text);
    }
}
