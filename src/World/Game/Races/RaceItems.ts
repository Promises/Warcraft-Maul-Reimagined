export type RaceTier = 'Beginner' | 'Intermediate' | 'Advanced' | 'Random' | 'Secondary' | 'Dev' | 'Other';

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
    /** First line of the description in the map's string table, or Random for the random picks */
    tier: RaceTier;
}

/** Item ids of the random picks, shared by the shops and the selection panel */
export const RANDOM_PICK_ITEMS = {
    normal: 'I00V',
    hardcore: 'I00W',
    hybrid: 'I00X',
} as const;

export const RACE_TIERS: RaceTier[] = ['Beginner', 'Intermediate', 'Advanced', 'Random'];

/**
 * The race and random-pick items as defined in the map's object data, read at build time so
 * the selection panel shows the same icon, name, description and cost as the old shops did.
 * The tier comes from the first line of each item's description (e.g. "Advanced").
 */
export const RaceItems: Record<string, RaceItemDef> = compiletime(({objectData}) => {
    // Resolve TRIGSTR references through the map's string table to read the tier line
    const wts = require('fs').readFileSync('maps/map.w3x/war3map.wts', 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
    const strings: Record<string, string> = {};
    const entry = /STRING (\d+)\n(?:\/\/[^\n]*\n)?\{\n([\s\S]*?)\n\}/g;
    let match;
    while ((match = entry.exec(wts)) !== null) {
        strings[match[1]] = match[2];
    }
    const resolve = (text: string): string => {
        const ref = /^TRIGSTR_(\d+)$/.exec(text || '');
        return ref ? (strings[ref[1]] || '') : (text || '');
    };
    const randomIds = ['I00V', 'I00W', 'I00X'];
    const tierOf = (id: string, description: string): string => {
        if (randomIds.indexOf(id) !== -1) {
            return 'Random';
        }
        // The string table uses both real newlines and WC3's |n line break
        const first = resolve(description).split(/\n|\|n/)[0].replace(/\|c[0-9a-fA-F]{8}|\|r/g, '').trim();
        if (first === 'Secondary Race') {
            return 'Secondary';
        }
        return ['Beginner', 'Intermediate', 'Advanced'].indexOf(first) !== -1 ? first : 'Other';
    };

    // Everything the race shops sold, plus the random picks and the random-only Loot Boxer
    const shops = ['h03Q', 'h00H', 'h00O', 'h03C', 'h03K'];
    const ids: string[] = ['I02D'];
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
            tier: tierOf(id, item.tooltipExtended) as RaceTier,
        };
    }
    return items;
}) as Record<string, RaceItemDef>;
