export interface RaceItemDef {
    /** Object data item id, e.g. 'I02G' */
    id: string;
    /** Localisable name (a TRIGSTR reference, resolve with GetLocalizedString) */
    name: string;
    icon: string;
    /** Localisable description */
    description: string;
    goldCost: number;
    lumberCost: number;
}

/** Item ids of the random picks, shared by the shops and the selection panel */
export const RANDOM_PICK_ITEMS = {
    normal: 'I00V',
    hardcore: 'I00W',
    hybrid: 'I00X',
} as const;

/**
 * The race and random-pick items as defined in the map's object data, read at build time so
 * the selection panel shows the same icon, name, description and cost as the old shops did.
 */
export const RaceItems: Record<string, RaceItemDef> = compiletime(({objectData}) => {
    // Everything the race shops sold, plus the random picks
    const shops = ['h03Q', 'h00H', 'h00O', 'h03C', 'h03K'];
    const ids: string[] = [];
    for (const shop of shops) {
        const unit = objectData.units.get(shop);
        for (const id of String(unit?.itemsSold ?? '').split(',')) {
            if (id !== '' && ids.indexOf(id) === -1) {
                ids.push(id);
            }
        }
    }
    const items: Record<string, RaceItemDef> = {};
    for (const id of ids) {
        const item = objectData.items.get(id);
        if (!item) {
            continue;
        }
        items[id] = {
            id,
            name: item.name,
            icon: item.interfaceIcon,
            description: item.tooltipExtended,
            goldCost: item.goldCost || 0,
            lumberCost: item.lumberCost || 0,
        };
    }
    return items;
}) as Record<string, RaceItemDef>;
