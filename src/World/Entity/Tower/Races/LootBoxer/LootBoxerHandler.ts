import {Log} from '../../../../../lib/Serilog/Serilog';
import {SyncTrace} from '../../../../../lib/SyncTrace';
import {Defender} from '../../../Players/Defender';
import {TowerConstruction} from '../../TowerConstruction';
import {WarcraftMaul} from '../../../../WarcraftMaul';
import {Tower} from '../../Specs/Tower';
import {Trigger, Unit} from "w3ts";
import {ReplaceUnit, Util} from "../../../../../lib/translators";
import {
    HybridTierEight,
    HybridTierFive,
    HybridTierFour, HybridTierNine,
    HybridTierOne, HybridTierSeven,
    HybridTierSix,
    HybridTierThree,
    HybridTierTwo,
} from "../../../../Game/Races/HybridRandom";

export class LootBoxerHandler {
    private abilityUpgradeTrigger: Trigger;
    constuction: TowerConstruction;
    game: WarcraftMaul;


    constructor(constuction: TowerConstruction, game: WarcraftMaul) {
        this.constuction = constuction;
        this.game = game;
        this.abilityUpgradeTrigger = Trigger.create();
        TriggerRegisterAnyUnitEventBJ(this.abilityUpgradeTrigger.handle, EVENT_PLAYER_UNIT_SPELL_CAST);
        this.abilityUpgradeTrigger.addCondition(() => this.IsUpgradeAbility());
        this.abilityUpgradeTrigger.addAction(() => this.UpgradeToTower());

    }

    private GetId(tier: number): number {
        let newId: number;
        switch (tier + 1) {
            case 1:
                newId = FourCC(HybridTierOne[Util.RandomInt(0, HybridTierOne.length - 1)].id);
                break;
            case 2:
                newId = FourCC(HybridTierTwo[Util.RandomInt(0, HybridTierTwo.length - 1)].id);
                break;
            case 3:
                newId = FourCC(HybridTierThree[Util.RandomInt(0, HybridTierThree.length - 1)].id);
                break;
            case 4:
                newId = FourCC(HybridTierFour[Util.RandomInt(0, HybridTierFour.length - 1)].id);
                break;
            case 5:
                newId = FourCC(HybridTierFive[Util.RandomInt(0, HybridTierFive.length - 1)].id);
                break;
            case 6:
                newId = FourCC(HybridTierSix[Util.RandomInt(0, HybridTierSix.length - 1)].id);
                break;
            case 7:
                newId = FourCC(HybridTierSeven[Util.RandomInt(0, HybridTierSeven.length - 1)].id);
                break;
            case 8:
                newId = FourCC(HybridTierEight[Util.RandomInt(0, HybridTierEight.length - 1)].id);
                break;
            case 9:
                newId = FourCC(HybridTierNine[Util.RandomInt(0, HybridTierNine.length - 1)].id);
                break;
            default:
                Log.Fatal('failed to get loot boxer tier');
                newId = FourCC(HybridTierOne[Util.RandomInt(0, HybridTierOne.length - 1)].id);
                break;
        }
        return newId;
    }

    public handleLootBoxTower(tower: Unit, owner: Defender, tier: number): Unit {
        let newId: number;
        const lootBoxer = owner.getLootBoxer();
        if (!lootBoxer) {
            return tower;
        }
        if (tier >= 3) {
            tower.setAbilityLevel(FourCC('A0EX'), tier + 1)
            return tower;
        }

        newId = this.GetId(tier);

        this.AddItemToLootBoxer(tier, lootBoxer);

        const oldUnit = Unit.fromHandle(GetConstructedStructure());
        tower = ReplaceUnit(
            oldUnit,
            newId,
            bj_UNIT_STATE_METHOD_DEFAULTS)!;

        return tower;
    }


    /**
     * Gives the Loot Boxer the loot of a box of that tier (0-based): rolls 1-100 and picks by the
     * tier's odds. Every roll goes to the log file (and the test trace), so the odds can be
     * checked from a real game.
     */
    private AddItemToLootBoxer(tier: number, lootBoxer: Unit): void {
        const roll: number = Util.RandomInt(1, 100);
        const [itemId, charges] = this.Loot(tier, roll);
        const item = lootBoxer.addItemById(FourCC(itemId));
        // On the item just given: GetLastCreatedItem() is not set by UnitAddItemById
        if (item && charges > 0) {
            item.charges = charges;
        }
        const text = `p${lootBoxer.owner.id} tier=${tier + 1} roll=${roll} item=${itemId} charges=${charges}`;
        Log.Info(`Loot Boxer: ${text}`);
        SyncTrace.note('lootbox', text);
    }

    /**
     * The item a box of that tier (0-based) gives for a roll of 1-100, and its charges (0: as made).
     * From tier 4 the chance of Rocks falls by 10 a tier (80% at tier 4, 60% at tier 6), and the
     * better items take its place; tiers 7-9 give no Rocks.
     */
    private Loot(tier: number, roll: number): [string, number] {
        if (tier < 3) {
            if (roll <= 100 - (5 * (tier + 1))) {
                return ['I02F', 0];
            } else if (roll <= 100 - 2 * (tier + 1)) {
                return ['I029', 0];
            }
            return ['I02B', 0];
        }
        switch (tier + 1) {
            case 4:
            case 5:
                if (roll <= 100 - 20 - 10 * (tier - 4 + 1)) {
                    return ['I02F', GetRandomInt(1, tier)];
                } else if (roll <= 100 - 10 - 5 * (tier - 4 + 1)) {
                    return ['I029', 0];
                } else if (roll <= 100 - 2 * (tier - 3 + 1)) {
                    return ['I02B', 0];
                }
                return ['I028', 0];
            case 6:
                if (roll <= 100 - 20 - 10 * (tier - 4 + 1)) {
                    return ['I02F', GetRandomInt(1, tier)];
                } else if (roll <= 100 - 10 - 5 * (tier - 4 + 1)) {
                    return ['I02B', 0];
                } else if (roll <= 100 - 2 * (tier - 3 + 1)) {
                    return ['I028', 0];
                }
                return ['I02A', 0];
            case 7:
                return this.HighTierLoot(roll, 'I028', 70, 'I02B', 85, 'I02A', 95, 'I02C');
            case 8:
                return this.HighTierLoot(roll, 'I028', 65, 'I02A', 80, 'I02B', 92, 'I02C');
            case 9:
                return this.HighTierLoot(roll, 'I028', 60, 'I02A', 80, 'I02B', 90, 'I02C');
            default:
                Log.Fatal('failed to get loot boxer item tier');
                return this.Loot(1, roll);
        }
    }

    /** Tiers 7-9: no Rocks, the item each chance is up to, and the default above them all. */
    private HighTierLoot(roll: number,
                         itemOne: string,
                         chanceOne: number,
                         itemTwo: string,
                         chanceTwo: number,
                         itemThree: string,
                         chanceThree: number,
                         defaultItem: string): [string, number] {
        if (roll <= chanceOne) {
            return [itemOne, 0];
        } else if (roll <= chanceTwo) {
            return [itemTwo, 0];
        } else if (roll <= chanceThree) {
            return [itemThree, 0];
        }
        return [defaultItem, 0];
    }

    private IsUpgradeAbility(): boolean {
        return GetSpellAbilityId() === FourCC('A0EX');
    }

    private UpgradeToTower(): void {
        let tower = Unit.fromHandle(GetSpellAbilityUnit());

        if (!tower) {
            return;
        }
        const owner: Defender | undefined = this.game.players.get(tower.owner.id);
        if (!owner) {
            return;
        }

        const instance: Tower | undefined = owner.GetTower(tower.id);
        if (instance) {
            instance.Sell();
        }

        // The box's tier, while the unit is still the box: the tower it turns into is no box
        const tier = this.constuction.lootBoxerTowers.indexOf(tower.typeId);
        tower = ReplaceUnit(
            tower,
            this.GetId(tier),
            bj_UNIT_STATE_METHOD_DEFAULTS)!;

        const lootBoxer = owner.getLootBoxer();

        if (lootBoxer) {
            this.AddItemToLootBoxer(tier, lootBoxer);
        }

        this.constuction.SetupTower(tower, owner);
    }
}
