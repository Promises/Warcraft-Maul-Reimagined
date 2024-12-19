export interface GameTowerDef {
    id: string;
    name: string;
    icon?: string;
    level: number;
    goldCost: number;
    // Top line tooltip (name etc)
    toolTipBasic: string;
    // tool tip description
    toolTipExtended: string;
    model: string;
    modelScale: number;
}

