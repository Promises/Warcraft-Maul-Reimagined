import {
    AdaptiveTuning,
    DEFAULT_TUNING,
    LaneOutcome,
    applyPoints,
    effectivePlayerDifficulty,
    scoreWave,
    scoreWaveDetailed,
} from '../../src/World/Game/AdaptiveDifficulty';

type Check = (this: void, what: string, ok: boolean, detail?: string) => void;

// Tests are written against the tuning's own fields, not hard-coded numbers, so they assert the
// invariants (a leak eases, a clean wave climbs, drops are slower than rises, offsets stay in the
// window) and survive a tuning change as long as the invariant holds.
const T: AdaptiveTuning = DEFAULT_TUNING;

function outcome(leaks: number, deepestFraction: number): LaneOutcome {
    return { leaks, deepestFraction };
}

export function adaptiveTests(check: Check): void {
    // scoreWave: leaks push easier, a clean wave climbs, walls and near-leaks hold.
    check('a leak scores negative', scoreWave(outcome(1, 0.5), T, false) < 0);
    check('a clean mid wave drifts up', scoreWave(outcome(0, 0.5), T, false) === T.drift);
    check('dominating beats the drift', scoreWave(outcome(0, T.earlyFraction - 0.01), T, false) > T.drift);
    check('a near-leak holds', scoreWave(outcome(0, T.lateFraction + 0.01), T, false) === 0);
    check('surviving a hard wave holds', scoreWave(outcome(0, 0.5), T, true) === 0);
    check('a hard wave softens a leak',
        Math.abs(scoreWave(outcome(1, 0.5), T, true)) < Math.abs(scoreWave(outcome(1, 0.5), T, false)));
    check('many leaks cap the penalty',
        scoreWave(outcome(3, 0.5), T, false) === scoreWave(outcome(9, 0.5), T, false));

    // The reason each wave gives, for the telemetry.
    check('reason leak', scoreWaveDetailed(outcome(2, 0.5), T, false).reason === 'leak');
    check('reason hardhold', scoreWaveDetailed(outcome(0, 0.5), T, true).reason === 'hardhold');
    check('reason early', scoreWaveDetailed(outcome(0, 0), T, false).reason === 'early');
    check('reason near', scoreWaveDetailed(outcome(0, 1), T, false).reason === 'near');
    check('reason drift', scoreWaveDetailed(outcome(0, 0.5), T, false).reason === 'drift');

    // applyPoints: a rise needs fewer points than a drop, the value stays in the band, points carry.
    check('one rise threshold raises a step', applyPoints(200, T.riseThreshold, T).value === 200 + T.step);
    check('the same easing does not yet drop (drops are slower)',
        applyPoints(200, -T.riseThreshold, T).value === 200);
    check('a full drop threshold drops a step', applyPoints(200, -T.dropThreshold, T).value === 200 - T.step);
    check('rising is capped at max', applyPoints(T.max, T.riseThreshold * 10, T).value === T.max);
    check('dropping is floored at min', applyPoints(T.min, -T.dropThreshold * 10, T).value === T.min);
    check('leftover points carry', applyPoints(200, T.riseThreshold + 2, T).carry === 2);

    // effectivePlayerDifficulty: the offset is held to the window, the result to the band.
    check('a small offset applies', effectivePlayerDifficulty(200, T.window - 10, T) === 200 + (T.window - 10));
    check('a big offset clamps to the window', effectivePlayerDifficulty(200, 999, T) === 200 + T.window);
    check('the result stays in the band', effectivePlayerDifficulty(T.max, T.window, T) === T.max);
}
