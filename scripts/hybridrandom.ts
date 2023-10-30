import * as fs from 'fs';
import * as path from 'path';

export type ValueTypes = string | number | boolean;

export interface Property {
    id: string;
    type: string;
    level: number;
    column: number;
    value: ValueTypes;
}


export interface CustomUnits {
    [key: string]: Property[];
}

export function processData(jsonData: { original: any; custom: Record<string, any[]> }): string[] {
    const weeiz: string[] = ['e00I'];
    const numbers: string[] = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tier_limits: number[] = [15, 99, 149, 299, 399, 499, 699, 899, 0];
    const tier_towers: string[][] = [];

    const e00IKey = Object.keys(jsonData.custom).find(key => key.startsWith(weeiz[0]));
    if (!e00IKey) {
        throw new Error("Couldn't find the key for e00I in the custom units.");
    }

    const ubuiValueForE00I = jsonData.custom[e00IKey].find((property: any) => property.id === 'ubui').value;
    const hybridTowers = Object.keys(jsonData.custom).filter(key => ubuiValueForE00I.includes(key.split(':')[0]));

    const goldCosts: Record<string, number> = {};
    hybridTowers.forEach(towerKey => {
        const goldProp = jsonData.custom[towerKey].find((property: any) => property.id === 'ugol');
        if (goldProp) {
            goldCosts[towerKey] = goldProp.value;
        }
    });

    hybridTowers.forEach(towerKey => {
        for (let i = 0; i < tier_limits.length; i++) {
            if (goldCosts[towerKey] <= tier_limits[i] || i === tier_limits.length - 1) {
                if (!tier_towers[i]) {
                    tier_towers[i] = [];
                }
                tier_towers[i].push(towerKey);
                break;
            }
        }
    });

    const generatedHybridList: string[] = [];

    for (let tier = 0; tier < tier_limits.length; tier++) {
        const tierString = numbers[tier];
        generatedHybridList.push(`export const HybridTier${tierString}: HybridTower[] = [`);
        tier_towers[tier].forEach(towerKey => {
            const unitId = towerKey.split(":")[0];
            const unitNameProp = jsonData.custom[towerKey].find((property: any) => property.id === 'unam');
            if (unitNameProp) {
                const unitName = unitNameProp.value;
                generatedHybridList.push(`    { id: '${unitId}', name: \`${unitName}\` }, // ${unitName}`);
            }
        });
        generatedHybridList.push("];");
    }

    return generatedHybridList;
}

export function saveToFile(outputPath: string, content: string[]): void {
    fs.writeFileSync(outputPath, content.join('\n'), 'utf-8');
}

export function loadJsonData(filePath: string): { original: any; custom: CustomUnits } {
    const rawData: string = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
}
const outputDir = 'src/Generated';
const jsonData = loadJsonData('war3mapUnits_structured.json');
const generatedCode = processData(jsonData);
saveToFile(path.join(outputDir, 'hybridRandomGEN.ts'), generatedCode)
