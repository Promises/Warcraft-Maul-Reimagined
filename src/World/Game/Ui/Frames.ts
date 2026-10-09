import {Frame, MapPlayer, Trigger} from 'w3ts';
import {Log} from '../../../lib/Serilog/Serilog';

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
            dropFocus(button.handle);
        }
        handler(player);
    });
}

/*
 * Clicks without the wait (hiveworkshop.com/threads/async-zero-latency-buttons.357700). A frame
 * click event is synced, so it reaches even the clicker's own client a round trip after the
 * click. But a local handler has nothing to sync: it changes the local view or sends a sync of
 * its own. So the clicker's client watches the button itself. A button with a pushed backdrop and
 * a mouse-over highlight shows the one while the mouse holds it down and the other while the mouse
 * is over it: when the pushed backdrop goes away with the mouse still over the button, that is the
 * click, and the handler runs then. An EscMenuButtonTemplate button (CustomTextButton,
 * CustomListButton, like ScriptDialogButton) has them as children 1 and 5. (A button template of
 * our own with a pushed backdrop and a highlight, for the host settings rows, crashed the game as
 * it loaded; those rows keep the synced click.) The synced click still comes; it only runs the handler when
 * the watch did not (a button of another kind, or a press it missed), so nothing is lost.
 */
// Where an EscMenuButtonTemplate button has them
const PUSHED_CHILD = 1;
const HIGHLIGHT_CHILD = 5;
// How often the clicker's client looks at its buttons: well under a frame
const WATCH_SECONDS = 0.01;

interface WatchedButton {
    button: framehandle;
    pushed: framehandle;
    highlight: framehandle;
    handler: (this: void) => void;
    held: boolean;
    // Clicks the watch ran the handler for, whose synced click is still to come
    ahead: number;
}

const watchedButtons: WatchedButton[] = [];

/**
 * Starts the watch: one timer, made on every client alike (it is a handle), called once while
 * the map starts. What it does in its ticks is local: reading this client's frames and running
 * local handlers.
 */
export function installAsyncClicks(): void {
    const timer = CreateTimer()!;
    TimerStart(timer, WATCH_SECONDS, true, () => {
        for (const watched of watchedButtons) {
            const held = BlzFrameIsVisible(watched.pushed);
            if (held === watched.held) {
                continue;
            }
            watched.held = held;
            // Let go over the button: a click (let go elsewhere is not one, as with the engine's)
            if (!held && BlzFrameIsVisible(watched.highlight) && BlzFrameGetEnable(watched.button)) {
                // The focus is left to the synced click (onClick): toggling the button now, as
                // the engine makes its click, could lose that click
                watched.ahead++;
                watched.handler();
            }
        }
    });
}

/** Gives a clicked button's keyboard focus up, so it does not swallow hotkeys. Local. */
function dropFocus(button: framehandle): void {
    BlzFrameSetEnable(button, false);
    BlzFrameSetEnable(button, true);
}

/**
 * A click handler for the clicker's own client only: local view changes and sync sends. On an
 * EscMenuButtonTemplate button it runs as the button is let go (see installAsyncClicks); on any
 * other it runs with the synced click.
 */
export function onLocalClick(button: Frame, handler: (this: void) => void): void {
    let watched: WatchedButton | undefined;
    if (BlzFrameGetChildrenCount(button.handle) > HIGHLIGHT_CHILD) {
        const pushed = BlzFrameGetChild(button.handle, PUSHED_CHILD);
        const highlight = BlzFrameGetChild(button.handle, HIGHLIGHT_CHILD);
        if (pushed !== undefined && highlight !== undefined) {
            watched = {button: button.handle, pushed, highlight, handler, held: false, ahead: 0};
            watchedButtons.push(watched);
        }
    }
    Log.Debug(`onLocalClick ${BlzFrameGetName(button.handle)}: ${watched ? 'at once' : 'with the synced click'}`);
    onClick(button, player => {
        if (player.handle !== GetLocalPlayer()) {
            return;
        }
        if (watched !== undefined && watched.ahead > 0) {
            watched.ahead--;
            return;
        }
        handler();
    });
}

/**
 * A boxed tooltip the engine shows while its owner is hovered. The box wraps one text frame
 * whose height follows its content, so the box always fits whatever text is set.
 */
/**
 * Where a tooltip opens from its anchor: above it (the default), or from one of its corners, to
 * keep a tooltip of a panel's top row on the screen. The box stays clear of the anchor by the gap.
 */
export type TooltipPlacement = 'above' | 'belowRight' | 'belowLeft' | 'aboveRight' | 'aboveLeft';

export class Tooltip {
    private readonly box: Frame;
    private readonly text: Frame;

    constructor(name: string, owner: Frame, width: number, anchor: Frame = owner, placement: TooltipPlacement = 'above') {
        this.box = Frame.createType(`${name}Tooltip`, owner, 0, 'BACKDROP', 'BoxedTextBackgroundTemplate')!;
        this.text = createText(`${name}TooltipText`, this.box, '', TEXT_JUSTIFY_TOP, TEXT_JUSTIFY_LEFT);
        // Height 0: the text grows with its content and the box follows it
        this.text.setSize(width - 2 * TOOLTIP_PADDING, 0);
        // From a corner the box keeps the same distance from the anchor as above it
        const corner = TOOLTIP_GAP;
        if (placement === 'belowRight') {
            this.text.setPoint(FRAMEPOINT_TOPLEFT, anchor, FRAMEPOINT_BOTTOMRIGHT, corner, -corner);
        } else if (placement === 'belowLeft') {
            this.text.setPoint(FRAMEPOINT_TOPRIGHT, anchor, FRAMEPOINT_BOTTOMLEFT, -corner, -corner);
        } else if (placement === 'aboveRight') {
            this.text.setPoint(FRAMEPOINT_BOTTOMLEFT, anchor, FRAMEPOINT_TOPRIGHT, corner, corner);
        } else if (placement === 'aboveLeft') {
            this.text.setPoint(FRAMEPOINT_BOTTOMRIGHT, anchor, FRAMEPOINT_TOPLEFT, -corner, corner);
        } else {
            this.text.setPoint(FRAMEPOINT_BOTTOM, anchor, FRAMEPOINT_TOP, 0, TOOLTIP_GAP);
        }
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
