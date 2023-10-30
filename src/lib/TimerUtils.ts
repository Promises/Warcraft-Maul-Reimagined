import { LinkedList } from './LinkedList';
import { Timer } from "w3ts";
import type { Node } from './Node';

export class TimerUtils {

    // Settings
    private static readonly QUANTITY = 256;
    private static readonly MAX_SIZE = 8190;

    // Globals
    private static readonly TIMER_QUEUE: LinkedList<Timer> = new LinkedList<Timer>();

    // Static only class
    protected constructor() { }

    static {
        for (let i = 0; i < this.QUANTITY - this.TIMER_QUEUE.getSize(); i++) {
            this.TIMER_QUEUE.add(new Timer());
        }
    }

    public static newTimer(): Timer {
        const t: Node<Timer> | undefined = this.TIMER_QUEUE.pop();
        if (t === undefined) {
            return new Timer();
        }

        return t.value;
    }

    public static releaseTimer(t: Timer): void {
        if (t === undefined) {
            return print('Warning: attempt to release an undefined timer');
        }

        if (this.TIMER_QUEUE.getSize() === this.MAX_SIZE) {
            print('Warning: Timer stack is full, destroying timer!!');
            t.destroy();
            return;
        }

        t.pause();
        this.TIMER_QUEUE.add(t);
    }
}
