import {HybridTower} from "./HybridRandom.types";

/**
 * Generates the hybrid random settings during build time
 */

export const {
    HybridTierOne,
    HybridTierTwo,
    HybridTierThree,
    HybridTierFour,
    HybridTierFive,
    HybridTierSix,
    HybridTierSeven,
    HybridTierEight,
    HybridTierNine
} = compiletime(({objectData, constants}) => {
    const TEMP_HYBRID_RANDOM_ARR = [
        'u00C',
        'u00D',
        'u00E',
        'u00F',
        'h00Z',
        'h011',
        'h010',
        'o01R',
        'o01M',
        'o01N',
        'h03W',
        'hC66',
        'hC21',
        'o003',
        'o009',
        'oC14',
        'h01C',
        'n009',
        'n03D',
        'n055',
        'n029',
        'n01Y',
        'n05H',
        'h02H',
        'h01Z',
        'h03D',
        'hC27',
        'hC08',
        'o004',
        'oC18',
        'oC19',
        'o00A',
        'oC35',
        'n00O',
        'n05I',
        'h020',
        'h04H',
        'h03U',
        'oC56',
        'oC58',
        'h01E',
        'n056',
        'n00M',
        'n05J',
        'n03E',
        'n02B',
        'n05K',
        'n01T',
        'h04F',
        'hC53',
        'hC36',
        'o005',
        'o00B',
        'oC73',
        'n02H',
        'n03F',
        'n02C',
        'n057',
        'h02A',
        'h022',
        'h01D',
        'n00L',
        'n05L',
        'n03G',
        'n01U',
        'n058',
        'h005',
        'h025',
        'hC54',
        'h03X',
        'h00Q',
        'h00M',
        'hC94',
        'o00R',
        'o007',
        'o012',
        'oC26',
        'o00X',
        'oC64',
        'hC34',
        'n05M',
        'n03H',
        'n059',
        'h02J',
        'h026',
        'h02R',
        'hC02',
        'hC11',
        'h006',
        'e00K',
        'e00L',
        'e00O',
        'e00J',
        'n010',
        'n00U',
        'h04K',
        'h02G',
        'h02F',
        'h03E',
        'h03I',
        'h03F',
        'e00E',
        'hC80',
        'hC82',
        'hC86',
        'h04T',
        'h04R',
        'h041',
        'h04M',
        'o00C',
        'n00F',
        'n00G',
        'n00H',
        'n018',
        'u010',
        'u011',
        'u012',
        'u013',
        'u01C',
        'o01O',
        'o01P',
        'o01S',
        'h03V',
        'hC97',
        'h00R',
        'o006',
        'oC67',
        'oC60',
        'h01G',
        'n00N',
        'n05B',
        'n03I',
        'n02D',
        'n05A',
        'n01W',
        'h02K',
        'h02L',
        'h027',
        'h04B',
        'o013',
        'oC68',
        'o00D',
        'o00Q',
        'o00S',
        'n00P',
        'n05N',
        'n03J',
        'n01Z',
        'h04G',
        'h00K',
        'h00F',
        'h00N',
        'o016',
        'oC74',
        'o015',
        'o008',
        'o00G',
        'o00U',
        'o00P',
        'o00Y',
        'h04I',
        'n05O',
        'n02E',
        'n01X',
        'n05C',
        'n020',
        'h028',
        'h029',
        'h04C',
        'h002',
        'o01B',
        'o00N',
        'oC65',
        'h01U',
        'n03L',
        'n02F',
        'n05D',
        'n03B',
        'n021',
        'h02B',
        'h04D',
        'h00L',
        'h000',
        'o00L',
        'eC93',
        'n00R',
        'n00S',
        'n05Q',
        'n03K',
        'n05F',
        'n02R',
        'n05E',
        'n02G',
        'h02Q',
        'h02D',
        'h02C',
        'h00I',
        'h02V',
        'e00P',
        'e00Q',
        'e00R',
        'e00S',
        'e00T',
        'o001',

        // Seems limit is 204 building, leaving this here for now
        // 'o00Z',
        // 'h01M',
        // 'h01A',
        // 'h03G',
        // 'h03H',
        // 'h00B',
        // 'h00G',
        // 'e008',
        // 'h04N',
        // 'h04Q',
        // 'h04O',
        // 'n019',
        // 'n01A',
        // 'n01B',
        // 'n01C',
        // 'o00V'
    ]
    const unit = objectData.units.get('e00I'); // WEEIZ

    if (!unit) {
        return;
    }

    unit.structuresBuilt = TEMP_HYBRID_RANDOM_ARR.join(',');

    objectData.save();

    const weeiz: string[] = ['e00I'];
    const numbers: string[] = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tier_limits: number[] = [15, 99, 149, 299, 399, 499, 699, 899, 0];
    const tier_towers: string[][] = [];


    const goldCosts: Record<string, number> = {};
    TEMP_HYBRID_RANDOM_ARR.forEach(towerKey => {
        const unit = objectData.units.get(towerKey)
        if (unit?.goldCostundefined) {
            goldCosts[towerKey] = unit.goldCostundefined;
        }
    });

    TEMP_HYBRID_RANDOM_ARR.forEach(towerKey => {
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

    const returnTiers: Record<string, HybridTower[]> = {
        HybridTierOne: [],
        HybridTierTwo: [],
        HybridTierThree: [],
        HybridTierFour: [],
        HybridTierFive: [],
        HybridTierSix: [],
        HybridTierSeven: [],
        HybridTierEight: [],
        HybridTierNine: [],
    }

    for (let tier = 0; tier < tier_limits.length; tier++) {
        const tierString = numbers[tier];
        // generatedHybridList.push(`export const HybridTier${tierString}: HybridTower[] = [`);

        tier_towers[tier].forEach(towerKey => {
            const unit = objectData.units.get(towerKey)

            returnTiers[`HybridTier${tierString}` as keyof typeof returnTiers].push({
                name: unit?.name || 'UNKNOWN NAME',
                id: towerKey
            })
            // const unitId = towerKey.split(":")[0];
            // const unitNameProp = jsonData.custom[towerKey].find((property: any) => property.id === 'unam');
            // if (unitNameProp) {
            //     const unitName = unitNameProp.value;
            //     generatedHybridList.push(`    { id: '${unitId}', name: \`${unitName}\` }, // ${unitName}`);
            // }
        });
        // generatedHybridList.push("];");
    }

    return returnTiers;
}) as {
    HybridTierOne: HybridTower[],
    HybridTierTwo: HybridTower[],
    HybridTierThree: HybridTower[],
    HybridTierFour: HybridTower[],
    HybridTierFive: HybridTower[],
    HybridTierSix: HybridTower[],
    HybridTierSeven: HybridTower[],
    HybridTierEight: HybridTower[],
    HybridTierNine: HybridTower[],
};
