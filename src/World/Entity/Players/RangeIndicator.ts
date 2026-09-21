import {Effect, MapPlayer, Unit} from 'w3ts';
import {Defender} from './Defender';

// Range is measured from the building's edge; a 2x2 tower's half width
const TOWER_HALF_WIDTH = 64;
// The ring models are 100 units in radius and get scaled to the range. Each is a strip whose
// band width scales with it, so a thinner variant takes over as the scale grows and the line
// stays 6 to 12 units wide (scripts/range-ring-models.py builds them).
const MODEL_RADIUS = 100;
const RING_MODELS: {model: string, maxScale: number}[] = [
    {model: 'war3mapImported\\RangeRingWide.mdx', maxScale: 3},
    {model: 'war3mapImported\\RangeRingMid.mdx', maxScale: 8},
    {model: 'war3mapImported\\RangeRingFine.mdx', maxScale: Infinity},
];
// The ring's layers are team-colour textures, so its colour is a player colour: green
const RING_COLOUR_PLAYER = 6;
// The model's edge reads a touch outside where towers actually reach
const RADIUS_TRIM = 0.985;

/**
 * Draws a ring showing a tower's attack range for one player while their range check mode
 * is on. The effect is created on every client (handles must stay in step) with the model
 * only on the owner's client, so only they see it.
 */
export class RangeIndicator {
    private ring: Effect | undefined;

    constructor(private readonly player: Defender) {
    }

    public show(tower: Unit): void {
        this.hide();
        const range = BlzGetUnitWeaponRealField(tower.handle, UNIT_WEAPON_RF_ATTACK_RANGE, 0);
        if (range <= 0) {
            return;
        }
        const radius = range + TOWER_HALF_WIDTH;
        const scale = radius * RADIUS_TRIM / MODEL_RADIUS;
        const variant = RING_MODELS.find(candidate => scale <= candidate.maxScale) ?? RING_MODELS[RING_MODELS.length - 1];
        this.ring = Effect.create(this.player.isLocal() ? variant.model : '', tower.x, tower.y);
        if (!this.ring) {
            return;
        }
        this.ring.scale = scale;
        this.ring.setColorByPlayer(MapPlayer.fromIndex(RING_COLOUR_PLAYER)!);
    }

    public hide(): void {
        this.ring?.destroy();
        this.ring = undefined;
    }
}
