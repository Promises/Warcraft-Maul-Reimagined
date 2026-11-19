import {
    AdaptiveTuning,
    DEFAULT_TUNING,
    clampDifficulty,
    riseIncrement,
} from './AdaptiveDifficulty';

/**
 * v1 Blitz adaptive difficulty. The global difficulty rises on an exponential schedule (slow early,
 * steep late), applied one step at a time at the wave boundaries; each player's leaks ease their own
 * difficulty below the global at once. A player's creeps scale by `global - their leak ease`.
 *
 * Both inputs are unfakeable: the rise is pure time, the ease is real leaks (both synced), so every
 * client holds identical difficulties and the loop never desyncs. The economy is NOT an input (it is
 * transferable, so it is captured for analysis only, never acted on).
 */
export class AdaptiveDifficultyEngine {
    private readonly tuning: AdaptiveTuning;
    private global: number;
    private stepIndex: number = 0;
    // Per lane, the total difficulty eased off by that player's leaks (percent points, >= 0).
    private readonly leakEase: Map<number, number> = new Map<number, number>();

    // Overkill captured since the last snapshot, by lane: the killing-blow damage past the creep's
    // remaining HP (how much spare damage the defense had). Capture-only - v1 never acts on it - it
    // is the ungameable "kill headroom" signal for the v2 model to study. Reset at each snapshot.
    private readonly overkillSum: Map<number, number> = new Map<number, number>();
    private readonly overkillCount: Map<number, number> = new Map<number, number>();
    // Per lane, the total (scaled) HP of creeps spawned since the last snapshot - the HP pool the
    // defense had to chew through; paired with overkill it gives the kill-headroom for v2. Capture-only.
    private readonly spawnHpPool: Map<number, number> = new Map<number, number>();
    // Per lane, the fewest checkpoints-to-end any creep reached since the last snapshot (lower = a creep
    // got further, closer to leaking) - the ungameable margin signal for v2. -1 until a creep moves.
    private readonly deepestReached: Map<number, number> = new Map<number, number>();

    constructor(tuning: AdaptiveTuning = DEFAULT_TUNING) {
        this.tuning = tuning;
        this.global = tuning.start;
    }

    /** The HP/armor percent a creep in `lane` scales by: the global less that lane's leak ease. */
    public hpDifficultyForLane(lane: number): number {
        return clampDifficulty(this.global - (this.leakEase.get(lane) ?? 0), this.tuning);
    }

    /** How many random abilities a creep gets, derived from the global difficulty (team-wide). */
    public abilityLevelForWave(): number {
        const level: number = Math.floor((this.global - 100) / 100);
        return Math.max(0, Math.min(this.tuning.maxAbilityLevel, level));
    }

    /** The global team difficulty, for the scoreboard, telemetry and the debug readout. */
    public globalDifficulty(): number {
        return this.global;
    }

    /** How much a lane has been eased by leaks, for the telemetry. */
    public leakEaseForLane(lane: number): number {
        return this.leakEase.get(lane) ?? 0;
    }

    /** The rise step reached so far, for the telemetry. */
    public currentStep(): number {
        return this.stepIndex;
    }

    /** True when `wave` is a rise-step wave: the first at firstStepWave, then every stepEveryWaves. */
    public isRiseStepWave(wave: number): boolean {
        return wave >= this.tuning.firstStepWave
            && (wave - this.tuning.firstStepWave) % this.tuning.stepEveryWaves === 0;
    }

    /** Applies one exponential rise increment to the global; call once before a rise-step wave spawns. */
    public applyRiseStep(): void {
        this.global = clampDifficulty(this.global + riseIncrement(this.tuning, this.stepIndex), this.tuning);
        this.stepIndex++;
    }

    /** A creep reached its owner's exit (a leak): ease that lane's difficulty at once. */
    public registerLeak(lane: number): void {
        this.leakEase.set(lane, (this.leakEase.get(lane) ?? 0) + this.tuning.decreasePerLeak);
    }

    /** Records the overkill on a lethal hit in a lane (capture-only). */
    public registerOverkill(lane: number, overkill: number): void {
        this.overkillSum.set(lane, (this.overkillSum.get(lane) ?? 0) + overkill);
        this.overkillCount.set(lane, (this.overkillCount.get(lane) ?? 0) + 1);
    }

    /** A lane's overkill total and kill count since the last snapshot, for the telemetry. */
    public overkillSumForLane(lane: number): number {
        return this.overkillSum.get(lane) ?? 0;
    }
    public overkillCountForLane(lane: number): number {
        return this.overkillCount.get(lane) ?? 0;
    }

    /** Records the (scaled) HP of a creep spawned in a lane (capture-only HP pool). */
    public registerSpawnHp(lane: number, hp: number): void {
        this.spawnHpPool.set(lane, (this.spawnHpPool.get(lane) ?? 0) + hp);
    }

    /** A lane's spawned-HP pool since the last snapshot, for the telemetry. */
    public hpPoolForLane(lane: number): number {
        return this.spawnHpPool.get(lane) ?? 0;
    }

    /** Records how far a creep got (its checkpoints-to-end); keeps the lane's furthest (minimum). */
    public registerProgress(lane: number, checkpointsLeft: number): void {
        const current = this.deepestReached.get(lane);
        if (current === undefined || checkpointsLeft < current) {
            this.deepestReached.set(lane, checkpointsLeft);
        }
    }

    /** The fewest checkpoints-to-end a lane's creeps reached since the last snapshot (-1 if none moved). */
    public deepestReachedForLane(lane: number): number {
        return this.deepestReached.get(lane) ?? -1;
    }

    /** Clears the per-window capture tallies (overkill, HP pool); called once a snapshot reported them. */
    public resetWindow(): void {
        this.overkillSum.clear();
        this.overkillCount.clear();
        this.spawnHpPool.clear();
        this.deepestReached.clear();
    }

    /** The tuning this game runs, colon-joined, so each game's telemetry records which constants it used. */
    public tuningSummary(): string {
        const t = this.tuning;
        return [
            t.min, t.max, t.start, t.firstStepWave, t.stepEveryWaves,
            Math.round(t.riseBase * 100), Math.round(t.riseGrowth * 100),
            Math.round(t.decreasePerLeak * 100), t.maxAbilityLevel,
        ].join(':');
    }
}
