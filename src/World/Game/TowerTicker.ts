import { TickingTower } from '../Entity/Tower/Specs/TickingTower';
import { Tower } from '../Entity/Tower/Specs/Tower';
import { Log } from '../../lib/Serilog/Serilog';
import {Trigger} from "w3ts";

export class TowerTicker {
    private readonly trig: Trigger;
    // private tickingTowers: Map<number, TickingTower & Tower> = new Map<number, TickingTower & Tower>(); // FUCKING DESYNCS
    private tickingTowers: (Tower & TickingTower)[] = [];
    private tick: number = 0;
    private readonly maxTick: number = 100000;

    constructor() {
        this.trig = Trigger.create();
        this.trig.registerTimerEvent(0.10, true);
        this.trig.addAction(() => {
            this.tick = (this.tick + 1) % this.maxTick;
            this.tickingTowers.forEach((tickingTower) => {

                if (tickingTower.IsTargetTick(this.tick, this.maxTick)) {
                    tickingTower.Action();
                }
            });
        });
    }

    public AddTickingTower(id: number, tickingTower: TickingTower & Tower): void {
        this.tickingTowers.push(tickingTower);
    }

    public RemoveTickingTower(id: number): void {
        // tslint:disable-next-line:ter-arrow-parens
        this.tickingTowers = this.tickingTowers.filter((tower) => tower.UniqueID !== id);
    }

    public GetTickingTowerCount(): number {
        return this.tickingTowers.length;
    }
}
