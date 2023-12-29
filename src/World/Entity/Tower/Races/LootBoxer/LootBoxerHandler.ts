import {Log} from '../../../../../lib/Serilog/Serilog';
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


    private AddItemToLootBoxer(tier: number, lootBoxer: Unit): void {
        const randomInt: number = Util.RandomInt(1, 100);

        if (tier < 3) {
            if (randomInt <= 100 - (5 * (tier + 1))) {
                lootBoxer.addItemById(FourCC('I02F'));
            } else if (randomInt <= 100 - 2 * (tier + 1)) {
                lootBoxer.addItemById(FourCC('I029'));
            } else {
                lootBoxer.addItemById(FourCC('I02B'));
            }
        } else {
            switch (tier + 1) {
                case 4:
                case 5:
                    if (randomInt <= 100 - 20 + 10 * (tier - 4 + 1)) {
                        lootBoxer.addItemById(FourCC('I02F'));
                        SetItemCharges(GetLastCreatedItem()!, GetRandomInt(1, tier));
                    } else if (randomInt <= 100 - 10 + 5 * (tier - 4 + 1)) {
                        lootBoxer.addItemById(FourCC('I029'));
                    } else if (randomInt <= 100 - 2 * (tier - 3 + 1)) {
                        lootBoxer.addItemById(FourCC('I02B'));
                    } else {
                        lootBoxer.addItemById(FourCC('I028'));
                    }
                    break;
                case 6:
                    if (randomInt <= 100 - 20 + 10 * (tier - 4 + 1)) {
                        lootBoxer.addItemById(FourCC('I02F'));
                        SetItemCharges(GetLastCreatedItem()!, GetRandomInt(1, tier));
                    } else if (randomInt <= 100 - 10 + 5 * (tier - 4 + 1)) {
                        lootBoxer.addItemById(FourCC('I02B'));
                    } else if (randomInt <= 100 - 2 * (tier - 3 + 1)) {
                        lootBoxer.addItemById(FourCC('I028'));
                    } else {
                        lootBoxer.addItemById(FourCC('I02A'));
                    }
                    break;
                case 7:
                    this.GetRandomItem(tier, randomInt, lootBoxer, 'I028', 70, 'I02B', 85, 'I02A', 95, 'I02C');
                    break;
                case 8:
                    this.GetRandomItem(tier, randomInt, lootBoxer, 'I028', 65, 'I02A', 80, 'I02B', 92, 'I02C');
                    break;
                case 9:
                    this.GetRandomItem(tier, randomInt, lootBoxer, 'I028', 60, 'I02A', 80, 'I02B', 90, 'I02C');
                    break;

                default:
                    Log.Fatal('failed to get loot boxer item tier');
                    this.AddItemToLootBoxer(1, lootBoxer);
                    break;
            }
        }
    }

    private GetRandomItem(tier: number,
                          randomInt: number,
                          lootBoxer: Unit,
                          itemOne: string,
                          chanceOne: number,
                          itemTwo: string,
                          chanceTwo: number,
                          itemThree: string,
                          chanceThree: number,
                          defaultItem: string): void {
        if (randomInt <= 100 - 20 + 10 * (tier - 4 + 1)) {
            lootBoxer.addItemById(FourCC('I02F'));
            SetItemCharges(GetLastCreatedItem()!, GetRandomInt(1 + (tier - 5), tier));
        } else if (randomInt <= chanceOne) {
            lootBoxer.addItemById(FourCC(itemOne));
        } else if (randomInt <= chanceTwo) {
            lootBoxer.addItemById(FourCC(itemTwo));
        } else if (randomInt <= chanceThree) {
            lootBoxer.addItemById(FourCC(itemThree));
        } else {
            lootBoxer.addItemById(FourCC(defaultItem));
        }

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

        tower = ReplaceUnit(
            tower,
            this.GetId(this.constuction.lootBoxerTowers.indexOf(tower.typeId)),
            bj_UNIT_STATE_METHOD_DEFAULTS)!;

        const lootBoxer = owner.getLootBoxer();

        if (lootBoxer) {
            this.AddItemToLootBoxer(this.constuction.lootBoxerTowers.indexOf(tower.typeId), lootBoxer);

        }

        this.constuction.SetupTower(tower, owner);
    }
}
