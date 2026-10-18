import {Effect, MapPlayer, Unit} from 'w3ts';
import {Defender} from './Defender';
import {SyncTrace} from '../../../lib/SyncTrace';

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
 * is on, one ring per enabled attack when a tower has two with different reaches. The effects
 * are created on every client (handles must stay in step) with the model only on the owner's
 * client, so only they see them.
 */
export class RangeIndicator {
    private rings: Effect[] = [];

    constructor(private readonly player: Defender) {
    }

    public show(tower: Unit): void {
        this.hide();
        for (const range of RangeIndicator.attackRanges(tower)) {
            this.drawRing(tower, range);
        }
    }

    public hide(): void {
        for (const ring of this.rings) {
            ring.destroy();
        }
        this.rings = [];
    }

    // The reaches of the tower's enabled attacks, without repeats
    private static attackRanges(tower: Unit): number[] {
        const ranges: number[] = [];
        for (const index of [0, 1]) {
            if (!BlzGetUnitWeaponBooleanField(tower.handle, UNIT_WEAPON_BF_ATTACKS_ENABLED, index)) {
                continue;
            }
            const range = BlzGetUnitWeaponRealField(tower.handle, UNIT_WEAPON_RF_ATTACK_RANGE, index);
            if (range > 0 && !ranges.includes(range)) {
                ranges.push(range);
            }
        }
        if (ranges.length === 0) {
            // Nothing read as enabled: fall back to the first attack
            ranges.push(BlzGetUnitWeaponRealField(tower.handle, UNIT_WEAPON_RF_ATTACK_RANGE, 0));
        }
        return ranges;
    }

    private drawRing(tower: Unit, range: number): void {
        SyncTrace.note('range', `p${this.player.id} ring for ${SyncTrace.unit(tower)} range=${range}`);
        if (range <= 0) {
            return;
        }
        const radius = range + TOWER_HALF_WIDTH;
        const scale = radius * RADIUS_TRIM / MODEL_RADIUS;
        const variant = RING_MODELS.find(candidate => scale <= candidate.maxScale) ?? RING_MODELS[RING_MODELS.length - 1];
        const ring = Effect.create(this.player.isLocal() ? variant.model : '', tower.x, tower.y);
        SyncTrace.note('range', `p${this.player.id} ring scale=${string.format('%.2f', scale)}`
            + ` model=${variant.model} made=${ring !== undefined}`);
        if (!ring) {
            return;
        }
        ring.scale = scale;
        ring.setColorByPlayer(MapPlayer.fromIndex(RING_COLOUR_PLAYER)!);
        this.rings.push(ring);
    }
}
