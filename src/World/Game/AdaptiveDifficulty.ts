/**
 * v1 Blitz adaptive difficulty: a deterministic exponential rise by wave, eased per player by leaks.
 *
 * The rise is a pure function of the wave (time), so it cannot be gamed; the only down-signal is a
 * leak (a creep reaching a player's exit waypoint), which is a real combat outcome and equally
 * unfakeable - gold and towers are transferable, so the economy is deliberately NOT a live input
 * here (it is only captured for analysis). These are the pure helpers, with no game state, so the
 * unit tests can run them and they can never desync.
 */

export interface AdaptiveTuning {
    /** The difficulty band. */
    min: number;
    max: number;
    /** Where the global difficulty starts, held until the first rise step. */
    start: number;
    /** The first rise step is applied before this wave spawns (early waves sit at the base). */
    firstStepWave: number;
    /** Waves between rise steps after the first. */
    stepEveryWaves: number;
    /** The first rise increment, in percent points. */
    riseBase: number;
    /** Each rise increment is this multiple of the last (exponential: slow early, steep late). */
    riseGrowth: number;
    /** Percent points a single leaked creep eases that player's difficulty. */
    decreasePerLeak: number;
    /** Highest creep ability level; derived from the global difficulty. */
    maxAbilityLevel: number;
}

// Starting values - pure first guesses. v1 exists to capture data so these get dialled for v2.
export const DEFAULT_TUNING: AdaptiveTuning = {
    min: 100,
    max: 400,
    start: 160,
    firstStepWave: 6,
    stepEveryWaves: 2,
    riseBase: 3,
    riseGrowth: 1.25,
    decreasePerLeak: 5,
    maxAbilityLevel: 4,
};

/** The exponential rise increment at a step index (0 = the first step). */
export function riseIncrement(tuning: AdaptiveTuning, step: number): number {
    return tuning.riseBase * Math.pow(tuning.riseGrowth, step);
}

/** Holds a difficulty inside the tuning's band. */
export function clampDifficulty(value: number, tuning: AdaptiveTuning): number {
    return Math.max(tuning.min, Math.min(tuning.max, value));
}
