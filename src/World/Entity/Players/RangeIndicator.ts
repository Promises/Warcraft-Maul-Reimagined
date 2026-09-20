import {Unit} from 'w3ts';
import {Image} from '../../../JassOverrides/Image';
import {Defender} from './Defender';

const RING_TEXTURE = 'ReplaceableTextures\\Selection\\SelectionCircleLarge.blp';
// Range is measured from the building's edge; a 2x2 tower's half width
const TOWER_HALF_WIDTH = 64;

/**
 * Draws a ring showing a tower's attack range for one player while their range check mode
 * is on. The image is created on every client (handles must stay in step) and shown on the
 * owner's client only. An image cannot be resized, so each tower gets a fresh one.
 */
export class RangeIndicator {
    private ring: Image | undefined;

    constructor(private readonly player: Defender) {
    }

    public show(tower: Unit): void {
        this.hide();
        const range = BlzGetUnitWeaponRealField(tower.handle, UNIT_WEAPON_RF_ATTACK_RANGE, 0);
        if (range <= 0) {
            return;
        }
        const radius = range + TOWER_HALF_WIDTH;
        this.ring = new Image(RING_TEXTURE, radius * 2, tower.x, tower.y, 0);
        this.ring.colour = {red: 80, green: 255, blue: 120, alpha: 200};
        this.ring.SetImageRenderAlways(true);
        this.ring.visible = this.player.isLocal();
    }

    public hide(): void {
        if (this.ring) {
            this.ring.Destroy();
            this.ring = undefined;
        }
    }
}
