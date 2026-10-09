import type { DamageInstance } from './DamageEngine';

/** Something run on a damage event (DamageEngine.register). From runi95's scourge-survival port. */
export interface DamageEvent {
    event(this: void, d: DamageInstance): void;
}
