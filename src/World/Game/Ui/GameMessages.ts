import {Timer} from 'w3ts';
import {messageText} from './Frames';

// Where the game draws its messages: bottom-left, stacking upwards from above the console
const LEFT = 0.01;
const BOTTOM = 0.22;
const WIDTH = 0.5;
const MAX_LINES = 8;
// DisplayTextToPlayer and print take no duration
const DEFAULT_DURATION = 10;
const TICK = 0.25;

interface Line {
    text: string;
    expires: number;
}

const lines: Line[] = [];
// Game time from our own timer, so messages stay up while the game is paused
let elapsed = 0;

function render(): void {
    messageText().setText(lines.map(line => line.text).join('|n'));
}

function show(this: void, text: string, duration: number): void {
    lines.push({text, expires: elapsed + (duration > 0 ? duration : DEFAULT_DURATION)});
    while (lines.length > MAX_LINES) {
        lines.shift();
    }
    render();
}

/**
 * Game messages drawn by us instead of the game, so that our panels cover them: the game's
 * message frame (ORIGIN_FRAME_UNIT_MSG) draws over every custom frame on ConsoleUIBackdrop
 * whatever its parent or level, so Frames hides it and this shows the text in a frame of ours
 * below the panels. The text natives and print are patched to feed it; they still call the
 * original, so the messages also reach the F12 message log.
 * Messages the engine displays itself, without a script call, are no longer shown on screen.
 * Runs on every client; the lines are local view state and create no handles.
 */
export function installGameMessages(): void {
    const frame = messageText();
    frame.setAbsPoint(FRAMEPOINT_BOTTOMLEFT, LEFT, BOTTOM);
    // Height 0: the text grows upwards from its bottom edge with its content
    frame.setSize(WIDTH, 0);

    const displayText = DisplayTextToPlayer;
    const displayTimedText = DisplayTimedTextToPlayer;
    const clearText = ClearTextMessages;
    const originalPrint = print;
    const globals = globalThis as unknown as Record<string, unknown>;
    globals['DisplayTextToPlayer'] = function (this: void, player: player, x: number, y: number, message: string): void {
        displayText(player, x, y, message);
        if (player === GetLocalPlayer()) {
            show(message, DEFAULT_DURATION);
        }
    };
    globals['DisplayTimedTextToPlayer'] = function (this: void, player: player, x: number, y: number, duration: number,
                                                    message: string): void {
        displayTimedText(player, x, y, duration, message);
        if (player === GetLocalPlayer()) {
            show(message, duration);
        }
    };
    globals['ClearTextMessages'] = function (this: void): void {
        clearText();
        lines.length = 0;
        render();
    };
    globals['print'] = function (this: void, ...args: unknown[]): void {
        originalPrint(...args);
        show(args.map(arg => `${arg}`).join('    '), DEFAULT_DURATION);
    };

    Timer.create().start(TICK, true, () => {
        elapsed += TICK;
        const count = lines.length;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].expires <= elapsed) {
                lines.splice(i, 1);
            }
        }
        if (lines.length !== count) {
            render();
        }
    });
}
