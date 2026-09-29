import {Carried, Tower} from './Tower';
import {EndOfRoundTower} from './EndOfRoundTower';
import {SyncTrace} from '../../../../lib/SyncTrace';
import {DecodeFourCC} from '../../../../lib/translators';

// Attunement: +2% of the tower's base damage per level, a level at the end of every wave it stands
export const ATTUNEMENT_PER_LEVEL = 0.02;
export const ATTUNEMENT_CAP = 15;
// Surge: a Primal buys a level of Attunement, up to this many over its life
export const SURGE_PRICE = 60;
export const SURGE_LIMIT = 10;

/**
 * A tower that grows with the waves it stands (the Elementalist redesign). At the end of each wave
 * its Attunement rises by one, up to its cap, each level adding ATTUNEMENT_PER_LEVEL of its base
 * damage; a tower may also gain flat damage every wave (Undead, the Lich), and an Ascended tower a
 * share of its base damage every wave with no cap. All of it is handed on when it becomes another
 * tower (Tower.Upgrade), and a fusion takes it from both its ingredients.
 */
export class AttunedTower extends Tower implements EndOfRoundTower {
    public attunement: number = 0;
    // Flat damage gained each wave on top of Attunement, and what has been gained so far
    protected flatPerWave: number = 0;
    protected bonusDamage: number = 0;
    protected cap: number = ATTUNEMENT_CAP;
    // Ascended: this share of the base damage every wave it stands, uncapped, counted in waves
    protected growthPerWave: number = 0;
    private waves: number = 0;
    // Levels of Attunement bought with Surge
    public surged: number = 0;
    // The type's own base damage, before any growth
    private baseDamage: number = this.unit.getBaseDamage(0);

    public EndOfRoundAction(): void {
        if (this.attunement < this.cap) {
            this.attunement++;
        }
        this.bonusDamage += this.flatPerWave;
        this.waves++;
        this.applyDamage();
        SyncTrace.note('attune', `p${this.owner.id} type=${DecodeFourCC(this.GetTypeID())} attunement=${this.attunement}`
            + ` damage=${this.unit.getBaseDamage(0)}`);
    }

    public carry(): Carried {
        return {attunement: this.attunement, bonusDamage: this.bonusDamage};
    }

    /** Whether Surge can buy it a level: below the cap, and below Surge's limit. */
    public canSurge(): boolean {
        return this.attunement < this.cap && this.surged < SURGE_LIMIT;
    }

    /** One level of Attunement, bought. */
    public surge(): void {
        this.attunement++;
        this.surged++;
        this.applyDamage();
    }

    public receive(carried: Carried): void {
        this.attunement = Math.min(Math.max(this.attunement, carried.attunement), Math.max(this.cap, this.attunement));
        this.bonusDamage += carried.bonusDamage;
        this.applyDamage();
    }

    /** What Attunement and Ascended growth make of the tower's power: 1 plus their share of it. */
    protected growthShare(): number {
        return 1 + ATTUNEMENT_PER_LEVEL * this.attunement + this.growthPerWave * this.waves;
    }

    /** Puts the growth on the tower: its base damage, unless its power is elsewhere (Inferno). */
    protected applyDamage(): void {
        this.unit.setBaseDamage(Math.floor(this.baseDamage * this.growthShare()) + this.bonusDamage, 0);
    }
}

/** A mature piece: a tower grown or bought to the top of its line, the stuff Primals are fused from. */
export class MaturePiece extends AttunedTower {
}

/** An Ascended tower: keeps its Attunement, and gains 5% of its base damage every wave, uncapped. */
export class AscendedTower extends AttunedTower {
    protected growthPerWave: number = 0.05;
}
