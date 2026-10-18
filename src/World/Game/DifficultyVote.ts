/**
 * How the players' difficulty votes become one difficulty, with no game state so the unit tests can
 * run it. The plain average lets a few votes for the hardest setting pull a lobby that mostly wants
 * Normal far up, so the average is blended with the median, which sits with the majority.
 */

// The median's share of the result; the average has the rest
const MEDIAN_WEIGHT = 0.25;

/** The middle vote, or halfway between the two middle votes when the count is even. */
export function median(votes: number[]): number {
  const sorted = [...votes].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** The difficulty the votes (percentages, at least one) come to. */
export function votedDifficulty(votes: number[]): number {
  let total = 0;
  for (const vote of votes) {
    total += vote;
  }
  return (
    MEDIAN_WEIGHT * median(votes) + (1 - MEDIAN_WEIGHT) * (total / votes.length)
  );
}
