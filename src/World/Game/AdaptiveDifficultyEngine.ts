import {
    AdaptiveTuning,
    DEFAULT_TUNING,
    LaneOutcome,
    ScoreReason,
    applyPoints,
    effectivePlayerDifficulty,
    scoreWaveDetailed,
} from './AdaptiveDifficulty';

/**
 * The stateful side of the adaptive difficulty: holds the live difficulties, collects each wave's
 * leaks, and folds the wave's synced per-lane outcomes through the pure core (AdaptiveDifficulty).
 * All state moves at the synced wave boundary from synced inputs, so every client holds identical
 * numbers - the feedback loop into creep HP never diverges.
 *
 * Two axes, as the operator asked:
 *  - HP/armor percent: one global team value plus a per-lane offset held to a small window, so a
 *    player only ever pulls a little above or below the team (nobody trivial while someone's buried).
 *  - abilities: a single team-wide level (how many random abilities a creep gets), decoupled from the
 *    percent, stepping one at a time.
 *
 * recordWave/endWave return a full Fold so the caller can broadcast telemetry (every input the engine
 * read and every number it decided), letting the tuning be replayed and dialled in from real games.
 */

// The ability axis: its own small integer level and its own (slower) thresholds, decoupled from HP.
const MAX_ABILITY_LEVEL: number = 4;
const ABILITY_RISE_THRESHOLD: number = 10;
const ABILITY_DROP_THRESHOLD: number = 14;

// v1 has no "how deep did the creeps get" accelerator yet - that needs per-lane maze distance - so
// every lane reports a neutral depth and the score comes from leaks and the slow drift alone.
const NEUTRAL_FRACTION: number = 0.5;

/** One lane's fold result: what it did and what the engine decided for it. */
export interface LaneFold {
    lane: number;
    leaks: number;
    deepestFraction: number;
    reason: ScoreReason;
    score: number;
    offset: number;
    offsetCarry: number;
    difficulty: number;
}

/** One wave's fold result across the team, for telemetry. */
export interface Fold {
    hardWave: boolean;
    teamLeaks: number;
    global: number;
    globalCarry: number;
    abilityLevel: number;
    lanes: LaneFold[];
}

export class AdaptiveDifficultyEngine {
    private readonly tuning: AdaptiveTuning;

    // HP/armor axis.
    private hpGlobal: number;
    private hpGlobalCarry: number = 0;
    private readonly hpOffset: Map<number, number> = new Map<number, number>();
    private readonly hpOffsetCarry: Map<number, number> = new Map<number, number>();

    // Ability axis (team-wide).
    private abilityLevel: number = 0;
    private abilityCarry: number = 0;

    // Leaks counted during the wave now running, by lane; cleared when the wave is folded.
    private currentWaveLeaks: Map<number, number> = new Map<number, number>();

    constructor(tuning: AdaptiveTuning = DEFAULT_TUNING) {
        this.tuning = tuning;
        this.hpGlobal = tuning.start;
    }

    /** The HP/armor percent a creep spawning in `lane` is scaled by: the global pulled by that lane's offset. */
    public hpDifficultyForLane(lane: number): number {
        return effectivePlayerDifficulty(this.hpGlobal, this.hpOffset.get(lane) ?? 0, this.tuning);
    }

    /** How many random abilities a creep gets this wave (team-wide, decoupled from the HP percent). */
    public abilityLevelForWave(): number {
        return this.abilityLevel;
    }

    /** The team difficulty, for the scoreboard and the debug readout. */
    public globalDifficulty(): number {
        return this.hpGlobal;
    }

    /** The tuning this game runs, colon-joined, so each game's telemetry records which constants it used. */
    public tuningSummary(): string {
        const t = this.tuning;
        return [
            t.min, t.max, t.window, t.start, t.drift,
            Math.round(t.earlyFraction * 1000), Math.round(t.lateFraction * 1000),
            t.earlyBonus, t.leakPenalty, t.riseThreshold, t.dropThreshold, t.step,
            MAX_ABILITY_LEVEL, ABILITY_RISE_THRESHOLD, ABILITY_DROP_THRESHOLD,
        ].join(':');
    }

    /** Records one creep leaking out of its owner's lane during the current wave. */
    public registerLeak(lane: number): void {
        this.currentWaveLeaks.set(lane, (this.currentWaveLeaks.get(lane) ?? 0) + 1);
    }

    /**
     * Folds the wave that just ended, at the synced wave boundary: builds an outcome for every playing
     * lane from the leaks counted this wave, folds them, and clears the tally. Returns the fold detail
     * for telemetry. `hardWave` is true on the wave types that wall most teams (air/boss/champion).
     */
    public endWave(playingLanes: number[], hardWave: boolean): Fold {
        const outcomes: Map<number, LaneOutcome> = new Map<number, LaneOutcome>();
        for (const lane of playingLanes) {
            outcomes.set(lane, { leaks: this.currentWaveLeaks.get(lane) ?? 0, deepestFraction: NEUTRAL_FRACTION });
        }
        const fold: Fold = this.recordWave(outcomes, hardWave);
        this.currentWaveLeaks = new Map<number, number>();
        return fold;
    }

    /**
     * Folds one wave's per-lane outcomes into the difficulties and returns the detail. Kept separate
     * from endWave (and taking the outcomes directly) so the unit tests can drive it without the
     * leak-collection state.
     */
    public recordWave(outcomes: Map<number, LaneOutcome>, hardWave: boolean): Fold {
        const lanes: LaneFold[] = [];
        if (outcomes.size === 0) {
            return this.foldResult(hardWave, 0, lanes);
        }

        // Score each lane (keeping the reason), the team total and the team's leaks, from synced state.
        const scored: Array<{ lane: number; outcome: LaneOutcome; score: number; reason: ScoreReason }> = [];
        let teamTotal: number = 0;
        let teamLeaks: number = 0;
        for (const [lane, outcome] of outcomes) {
            const detail = scoreWaveDetailed(outcome, this.tuning, hardWave);
            scored.push({ lane, outcome, score: detail.score, reason: detail.reason });
            teamTotal += detail.score;
            teamLeaks += outcome.leaks;
        }
        const teamAverage: number = teamTotal / outcomes.size;

        // Global HP follows the team average.
        const global = applyPoints(this.hpGlobal, this.hpGlobalCarry + teamAverage, this.tuning);
        this.hpGlobal = global.value;
        this.hpGlobalCarry = global.carry;

        // Each lane's offset follows how that lane did relative to the team, held to the window.
        for (const entry of scored) {
            const carry: number = (this.hpOffsetCarry.get(entry.lane) ?? 0) + (entry.score - teamAverage);
            const offset = applyPoints(
                this.hpOffset.get(entry.lane) ?? 0, carry, this.tuning, -this.tuning.window, this.tuning.window);
            this.hpOffset.set(entry.lane, offset.value);
            this.hpOffsetCarry.set(entry.lane, offset.carry);
            lanes.push({
                lane: entry.lane,
                leaks: entry.outcome.leaks,
                deepestFraction: entry.outcome.deepestFraction,
                reason: entry.reason,
                score: entry.score,
                offset: offset.value,
                offsetCarry: offset.carry,
                difficulty: this.hpDifficultyForLane(entry.lane),
            });
        }

        // Abilities follow the team average on their own integer axis, stepping one level at a time.
        this.abilityCarry += teamAverage;
        while (this.abilityCarry >= ABILITY_RISE_THRESHOLD && this.abilityLevel < MAX_ABILITY_LEVEL) {
            this.abilityLevel++;
            this.abilityCarry -= ABILITY_RISE_THRESHOLD;
        }
        while (this.abilityCarry <= -ABILITY_DROP_THRESHOLD && this.abilityLevel > 0) {
            this.abilityLevel--;
            this.abilityCarry += ABILITY_DROP_THRESHOLD;
        }

        return this.foldResult(hardWave, teamLeaks, lanes);
    }

    private foldResult(hardWave: boolean, teamLeaks: number, lanes: LaneFold[]): Fold {
        return {
            hardWave,
            teamLeaks,
            global: this.hpGlobal,
            globalCarry: this.hpGlobalCarry,
            abilityLevel: this.abilityLevel,
            lanes,
        };
    }
}
