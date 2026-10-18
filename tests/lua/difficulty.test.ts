import {median, votedDifficulty} from '../../src/World/Game/DifficultyVote';

type Check = (this: void, what: string, ok: boolean, detail?: string) => void;

function near(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.01;
}

export function difficultyTests(check: Check): void {
    check('median of an odd count', median([400, 100, 200]) === 200);
    check('median of an even count', median([100, 400, 200, 300]) === 250);
    check('median leaves the votes unsorted', (() => {
        const votes = [400, 100];
        median(votes);
        return votes[0] === 400;
    })());

    // 5 for Normal, 2 for Medium, 2 for Extreme: an average of 188.9 and a median of 100
    const mixed = votedDifficulty([100, 100, 100, 100, 100, 200, 200, 400, 400]);
    check('a few hard votes pull less', near(mixed, 166.67), `${mixed}`);
    check('one vote is that vote', votedDifficulty([300]) === 300);
    check('agreeing votes are that difficulty', votedDifficulty([200, 200, 200]) === 200);
    check('a split lobby meets in the middle', votedDifficulty([100, 400]) === 250);
}
