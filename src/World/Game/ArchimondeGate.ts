import {Destructable, Trigger, Unit} from "w3ts";

export class ArchimondeGate {
    public readonly gate: Destructable;
    private trig: Trigger;

    constructor(archimonde: Unit) {
        this.gate = Destructable.create(FourCC('B000'), 3520.0, -5312.0, 0.000, 0.900, 0)!;
        this.trig = Trigger.create();
        this.trig.registerDeathEvent(this.gate);
        this.trig.addAction(() => archimonde.issueOrderAt('move', 1000.00, -5050.00));
    }
}
