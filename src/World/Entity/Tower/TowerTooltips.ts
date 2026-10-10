/** An ability's tooltip as one tower shows it, while that tower is selected. */
export interface TowerTooltip {
    ability: number;
    // Left as the ability's own when not given
    title?: string;
    text: string;
}

/** A tower with tooltips of its own (Tower.abilityTooltips). */
export interface TooltipTower {
    abilityTooltips(): TowerTooltip[];
}

// The abilities' tooltips as the map has them, kept the first time a tower replaces one
const originals: Map<number, {title: string, text: string}> = new Map<number, {title: string, text: string}>();

/**
 * Local: shows a selected tower's own tooltips for its abilities (a Primal's Power, the Haboob's
 * multishot, an egg's Awaken price). The game shows an ability's tooltip, one for every tower that
 * has it, not a tower's own copy of the field, so the local player's view of it is set as they
 * select the tower - and put back first, so a tower without its own shows the ability's again.
 * Only tooltips: nothing that is game state, so it may differ between clients.
 */
export function showTowerTooltips(tower: TooltipTower | undefined): void {
    originals.forEach((original, ability) => {
        BlzSetAbilityTooltip(ability, original.title, 0);
        BlzSetAbilityExtendedTooltip(ability, original.text, 0);
    });
    if (tower === undefined) {
        return;
    }
    for (const tooltip of tower.abilityTooltips()) {
        if (!originals.has(tooltip.ability)) {
            originals.set(tooltip.ability, {
                title: BlzGetAbilityTooltip(tooltip.ability, 0) ?? '',
                text: BlzGetAbilityExtendedTooltip(tooltip.ability, 0) ?? '',
            });
        }
        if (tooltip.title !== undefined) {
            BlzSetAbilityTooltip(tooltip.ability, tooltip.title, 0);
        }
        BlzSetAbilityExtendedTooltip(tooltip.ability, tooltip.text, 0);
    }
}
