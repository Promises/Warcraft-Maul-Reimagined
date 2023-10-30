import {Trigger, Unit} from "w3ts";

export class ArchimondeTeleport {
    private readonly trig: Trigger;

    constructor(archimonde: Unit) {
        this.trig = Trigger.create();
        TriggerRegisterEnterRectSimple(this.trig.handle, Rect(992.0, -5216.0, 1056.0, -4992.0))
        this.trig.addCondition(() => GetEnteringUnit() === archimonde.handle);
        this.trig.addAction(() => archimonde.destroy());
    }
}
