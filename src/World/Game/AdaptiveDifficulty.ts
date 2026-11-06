/**
 * Adaptive difficulty: the pure scoring, with no game state so the unit tests can run it and so it
 * can never desync. Every input is a number read from synced game state (leaks, how far creeps got,
 * the wave type), and the output is deterministic, so every client folds the same wave outcomes into
 * the same difficulties - the whole feedback loop stays identical across clients.
 *
 * The model: one global team difficulty, plus a per-player offset clamped to a small window around
 * it, so nobody plays trivial while someone else plays impossible - a player only ever pulls a little
 * above or below the team. Two independent axes, each scored the same way with its own accumulator:
 * the creep HP/armor percent, and the number of creep abilities.
 *
 * The signal: leaks are what matters, so a leak pushes a player easier (weighted by how many, and a
 * little less on an inherently-hard wave, so a wave that kills everyone does not over-drop anyone).
 * A clean wave drifts the difficulty up slowly - you cannot build one tower and coast, it still gets
 * a bit harder - with a bonus when the furthest creep barely advanced (dominating) and a hold when a
 * creep nearly leaked. Death position is only this gentle accelerator, never the driver, because a
 * player's killbox can sit anywhere in their maze; the real convergence is the slow push until a
 * leak, then ease back. Rising needs fewer points than dropping, so difficulty eases down more
 * slowly than it climbs.
 */

/** What one player's lane did in one wave, all from synced game state. */
export interface LaneOutcome {
    /** Creeps that crossed this player's exit checkpoint (leaked downstream) this wave. */
    leaks: number;
    /** 0..1: how far along the lane the furthest creep got before dying or leaking (1 = leaked). */
    deepestFraction: number;
}

export interface AdaptiveTuning {
    /** Difficulty floor and cap (percent), the band difficulty may never leave. */
    min: number;
    max: number;
    /** How far a player may sit from the global difficulty (plus or minus, percent). */
    window: number;
    /** Where everyone starts (percent). */
    start: number;
    /** Points a clean (zero-leak) wave adds: the slow "it still gets harder". */
    drift: number;
    /** deepestFraction at or below this is dominating: add earlyBonus on top of the drift. */
    earlyFraction: number;
    /** deepestFraction at or above this (with no leak) is a near-leak: hold, add nothing. */
    lateFraction: number;
    /** Extra points when dominating. */
    earlyBonus: number;
    /** Points one leaked creep subtracts (capped at a few creeps so one wave cannot swing wildly). */
    leakPenalty: number;
    /** Points needed to raise one step. */
    riseThreshold: number;
    /** Points (magnitude) needed to drop one step - larger than riseThreshold, so drops come slower. */
    dropThreshold: number;
    /** Percent moved per threshold crossing. */
    step: number;
}

/**
 * Starting values. Not tuned yet - the operator set start 160 and a +-30 window; the rest are first
 * guesses to be dialled in from live per-wave outcomes. Hard wave types (air/boss/champion/fortified)
 * are marked neutral by the caller, from the creep type, not listed here.
 */
export const DEFAULT_TUNING: AdaptiveTuning = {
    min: 100,
    max: 400,
    window: 30,
    start: 160,
    drift: 1,
    earlyFraction: 0.33,
    lateFraction: 0.85,
    earlyBonus: 2,
    leakPenalty: 4,
    riseThreshold: 6,
    dropThreshold: 8,
    step: 10,
};

/** Clamps a leak count so one wave on a full lane cannot swing the score wildly. */
const MAX_WEIGHTED_LEAKS = 3;
/** How much a leak's push is softened on an inherently-hard wave. */
const HARD_WAVE_LEAK_RELIEF = 0.5;

/** Why a wave scored as it did, for the telemetry so a fold can be read back offline. */
export type ScoreReason = 'leak' | 'hardhold' | 'early' | 'near' | 'drift';

/**
 * The points one player's wave contributes to their axis (positive pushes harder, negative easier)
 * and why. `hardWave` is true on wave types that kill most teams (air, boss, champion), where a leak
 * counts for less and a clean survival neither raises nor drops - the team just held a wall.
 */
export function scoreWaveDetailed(
    outcome: LaneOutcome, tuning: AdaptiveTuning, hardWave: boolean,
): { score: number; reason: ScoreReason } {
    if (outcome.leaks > 0) {
        const penalty: number = tuning.leakPenalty * Math.min(outcome.leaks, MAX_WEIGHTED_LEAKS);
        return { score: hardWave ? -penalty * HARD_WAVE_LEAK_RELIEF : -penalty, reason: 'leak' };
    }
    // No leak on a hard wave: hold, do not push either way - surviving a wall is not dominance.
    if (hardWave) {
        return { score: 0, reason: 'hardhold' };
    }
    if (outcome.deepestFraction <= tuning.earlyFraction) {
        return { score: tuning.drift + tuning.earlyBonus, reason: 'early' };
    }
    // Near-leak: creeps reached the last stretch, so hold rather than keep raising.
    if (outcome.deepestFraction >= tuning.lateFraction) {
        return { score: 0, reason: 'near' };
    }
    return { score: tuning.drift, reason: 'drift' };
}

/** The points one player's wave contributes; see scoreWaveDetailed for the reason alongside it. */
export function scoreWave(outcome: LaneOutcome, tuning: AdaptiveTuning, hardWave: boolean): number {
    return scoreWaveDetailed(outcome, tuning, hardWave).score;
}

/**
 * Folds accumulated points into difficulty steps, returning the new difficulty and the points left
 * over to carry to the next wave. Rising needs riseThreshold points, dropping the larger
 * dropThreshold, so difficulty eases down more slowly than it climbs. The value never leaves the band.
 */
export function applyPoints(
    current: number,
    points: number,
    tuning: AdaptiveTuning,
    low: number = tuning.min,
    high: number = tuning.max,
): { value: number; carry: number } {
    let value: number = current;
    let carry: number = points;
    while (carry >= tuning.riseThreshold && value < high) {
        value += tuning.step;
        carry -= tuning.riseThreshold;
    }
    while (carry <= -tuning.dropThreshold && value > low) {
        value -= tuning.step;
        carry += tuning.dropThreshold;
    }
    value = clamp(value, low, high);
    return { value, carry };
}

/**
 * A player's effective difficulty: the global difficulty pulled by their personal offset, with the
 * offset held to the window and the result held to the band. This is what a creep in that player's
 * lane is scaled by.
 */
export function effectivePlayerDifficulty(global: number, offset: number, tuning: AdaptiveTuning): number {
    const windowed: number = clamp(offset, -tuning.window, tuning.window);
    return clamp(global + windowed, tuning.min, tuning.max);
}

function clamp(value: number, low: number, high: number): number {
    return Math.max(low, Math.min(high, value));
}
