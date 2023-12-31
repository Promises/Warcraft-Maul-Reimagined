import { TimedEventQueue } from './TimedEventQueue';

export class TimedEvent {
    private time: number;
    private func: () => boolean;
    private safe: boolean;
    private endtime: number | undefined;

    constructor(func: (this:any) => boolean, time: number, safe: boolean = true) {
        this.safe = safe;
        this.time = time;
        this.func = func;
    }

    public AttemptAction(currentTick: number, teq: TimedEventQueue): boolean {
        if (!this.endtime) {
            this.endtime = ((currentTick + this.time) % 100000) - 1;
            if (this.endtime < 0) {
                this.endtime = 0;
            }
        }
        if (this.endtime <= currentTick) {
            if (this.safe) {
                teq.GetGame().safeEventQueue.AddMed(() => this.func()); // Wrap the method in an arrow function
            } else {
                teq.GetGame().eventQueue.AddMed(() => this.func()); // Wrap the method in an arrow function
            }
            return true;
        }
        return false;
    }
}
