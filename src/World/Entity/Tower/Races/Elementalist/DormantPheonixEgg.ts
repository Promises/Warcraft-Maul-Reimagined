import { Tower } from '../../Specs/Tower';
import { EndOfRoundTower } from '../../Specs/EndOfRoundTower';
import { Defender } from '../../../Players/Defender';
import { WarcraftMaul } from '../../../../WarcraftMaul';
import { Unit } from 'w3ts';
import { TowerTooltip } from '../../TowerTooltips';

// Awaken: turns the egg into the Humans' Phoenix Egg (AwakenDormantPheonixEgg)
const AWAKEN = FourCC('A0DV');
// The egg's mana counts the waves it has stood; this many make Awaken free
const WAVES_TO_WAKE = 5;

/**
 * Life + Fire. Gains a mana every wave; Awaken costs its full gold (the ability's own gold cost)
 * until the egg has WAVES_TO_WAKE mana, and nothing from then on: waiting saves the gold, paying
 * skips the wait. The price is set on this egg's own Awaken, so other eggs keep theirs; its
 * tooltip shows while the egg is selected (TowerTooltips).
 */
export class DormantPheonixEgg extends Tower implements EndOfRoundTower {
    private readonly fullPrice: number;
    // Awaken's tooltip as it is for this egg, shown while it is selected (TowerTooltips)
    private awakenTooltip: TowerTooltip | undefined;

    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        const awaken = BlzGetUnitAbility(this.unit.handle, AWAKEN);
        this.fullPrice = awaken ? BlzGetAbilityIntegerLevelField(awaken, ABILITY_ILF_GOLD_COST_NDT1, 0) : 0;
        if (awaken) {
            BlzSetAbilityIntegerLevelField(awaken, ABILITY_ILF_MANA_COST, 0, 0);
        }
        this.setPrice();
    }

    public EndOfRoundAction(): void {
        this.unit.mana += 1.00;
        this.setPrice();
    }

    private setPrice(): void {
        const awaken = BlzGetUnitAbility(this.unit.handle, AWAKEN);
        if (!awaken) {
            return;
        }
        const waves = Math.floor(this.unit.mana);
        const price = waves >= WAVES_TO_WAKE ? 0 : this.fullPrice;
        BlzSetAbilityIntegerLevelField(awaken, ABILITY_ILF_GOLD_COST_NDT1, 0, price);
        this.awakenTooltip = {
            ability: AWAKEN,
            title: `Awaken Phoenix Egg [|cffffcc00Z|r] - ${price === 0 ? '|cff00ff00free|r' : `|cffffcc00${price}|r gold`}`,
            text: 'Awakens the egg into a Phoenix Egg, the Humans\' tower that burns enemies near it and upgrades '
                + `into a Juvenile Phoenix.|n|nThe egg gains 1 mana every wave: at ${WAVES_TO_WAKE} Awaken is free. `
                + `Before that it costs ${this.fullPrice} gold, to skip the wait (${Math.min(waves, WAVES_TO_WAKE)}/${WAVES_TO_WAKE} now).`,
        };
        this.refreshTooltips();
    }

    public abilityTooltips(): TowerTooltip[] {
        return this.awakenTooltip ? [this.awakenTooltip] : [];
    }
}
