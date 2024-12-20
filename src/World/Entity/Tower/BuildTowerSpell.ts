import {WarcraftMaul} from '../../WarcraftMaul';
import {Trigger, Unit} from "w3ts";

export class BuildTowerSpell {
    private _buildTrigger: Trigger;
    private _game: WarcraftMaul;

    constructor(game: WarcraftMaul) {
        this._game = game;
        this._buildTrigger = Trigger.create();
        TriggerRegisterAnyUnitEventBJ(this._buildTrigger.handle, EVENT_PLAYER_UNIT_SPELL_CAST);
        this._buildTrigger.addCondition(() => this.AreWeSellingTheTower());
        this._buildTrigger.addAction(() => this.FindAndSellTower());
    }

    private AreWeSellingTheTower(): boolean {
        return GetSpellAbilityId() === FourCC('A0FL');
    }


    public SellTower(unit: Unit): void {
        // print(`Selling tower, ${unit.name}`)
        const ownerId = unit.owner.id;
        const owner = this._game.players.get(ownerId);
        if(owner) {
            owner.setBuildMode(true, owner.hybridTowers[0]);
        }

    }

    private FindAndSellTower(): void {
        const unit = Unit.fromEvent();
        this.SellTower(unit!);

    }
}
