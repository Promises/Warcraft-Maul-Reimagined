import {AdaptiveTuning, DEFAULT_TUNING, clampDifficulty, riseIncrement} from '../../src/World/Game/AdaptiveDifficulty';
import {AdaptiveDifficultyEngine} from '../../src/World/Game/AdaptiveDifficultyEngine';

type Check = (this: void, what: string, ok: boolean, detail?: string) => void;

const T: AdaptiveTuning = DEFAULT_TUNING;

function near(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.001;
}

export function adaptiveTests(check: Check): void {
    // Pure helpers: the exponential rise and the band clamp.
    check('rise step 0 is the base', near(riseIncrement(T, 0), T.riseBase));
    check('rise grows exponentially', near(riseIncrement(T, 1), T.riseBase * T.riseGrowth));
    check('each step is growth times the last', near(riseIncrement(T, 3) / riseIncrement(T, 2), T.riseGrowth));
    check('clamp holds the floor', clampDifficulty(T.min - 50, T) === T.min);
    check('clamp holds the ceiling', clampDifficulty(T.max + 50, T) === T.max);
    check('clamp passes a value in band', clampDifficulty(200, T) === 200);

    // Step cadence: first at firstStepWave, then every stepEveryWaves.
    const e = new AdaptiveDifficultyEngine(T);
    check('no step before the first step wave', !e.isRiseStepWave(T.firstStepWave - 1));
    check('first step at the first step wave', e.isRiseStepWave(T.firstStepWave));
    check('no step one wave after the first', !e.isRiseStepWave(T.firstStepWave + 1));
    check('step every stepEveryWaves', e.isRiseStepWave(T.firstStepWave + T.stepEveryWaves));

    // Exponential rise.
    check('starts at the base', e.hpDifficultyForLane(0) === T.start);
    const before: number = e.globalDifficulty();
    e.applyRiseStep();
    check('a rise step raises the global', e.globalDifficulty() > before);
    check('the first rise is the base increment', near(e.globalDifficulty(), T.start + riseIncrement(T, 0)));

    // A leak eases only that lane, and leaves others alone.
    e.registerLeak(0);
    check('a leak eases that lane',
        e.hpDifficultyForLane(0) === clampDifficulty(e.globalDifficulty() - T.decreasePerLeak, T));
    check('a leak leaves other lanes alone', e.hpDifficultyForLane(1) === clampDifficulty(e.globalDifficulty(), T));

    // The band holds at both edges.
    const capped: AdaptiveDifficultyEngine = new AdaptiveDifficultyEngine(T);
    for (let i: number = 0; i < 100; i++) {
        capped.applyRiseStep();
    }
    check('the global never exceeds max', capped.globalDifficulty() === T.max);
    const floored: AdaptiveDifficultyEngine = new AdaptiveDifficultyEngine(T);
    for (let i: number = 0; i < 100; i++) {
        floored.registerLeak(2);
    }
    check('a lane never drops below min', floored.hpDifficultyForLane(2) === T.min);

    // Abilities are derived from the global difficulty.
    check('no bonus abilities at the base', new AdaptiveDifficultyEngine(T).abilityLevelForWave() === 0);
    check('abilities climb with the global', capped.abilityLevelForWave() === Math.min(T.maxAbilityLevel, 3));
}
