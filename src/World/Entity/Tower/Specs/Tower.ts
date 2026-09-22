import { Defender } from '../../Players/Defender';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { EndOfRoundTower } from './EndOfRoundTower';
import { AttackActionTower } from './AttackActionTower';
import { GenericAutoAttackTower } from './GenericAutoAttackTower';
import { PassiveCreepDiesInAreaEffectTower } from './PassiveCreepDiesInAreaEffectTower';
import * as settings from '../../../GlobalSettings';
import { Log } from '../../../../lib/Serilog/Serilog';
import { Rectangle } from '../../../../JassOverrides/Rectangle';
import { InitialDamageModificationTower } from './InitialDamageModificationTower';
import { KillingActionTower } from './KillingActionTower';
import { TowerForce } from './TowerForce';
import { LimitedTower } from './LimitedTower';
import { ConstructActionTower } from './ConstructActionTower';
import { SellActionTower } from './SellActionTower';
import { TickingTower } from './TickingTower';
import { AntiJuggleTower } from '../../AntiJuggle/AntiJuggleTower';
import {Unit} from "w3ts";
import {ReplaceUnit, Util} from "../../../../lib/translators";

// A tower paid for while a wave was running is never fully refundable
const PAID_DURING_WAVE: number = -1;

export class Tower {


    private readonly _unit: Unit;
    private readonly _UniqueID: number;
    private readonly _owner: Defender;
    private readonly _game: WarcraftMaul;
    private _towerValue: number;
    // What this tower cost in one build phase, and which phase that was: sold in the same phase
    // that gold comes back in full, later only at settings.SELL_REFUND_RATE
    private _fullRefundValue: number;
    private _fullRefundPhase: number;
    private _leaverOwned: boolean = false;
    private targetTick: number | undefined;

    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        this._game = game;
        this._unit = tower;
        this._UniqueID = tower.id;
        this._owner = owner;
        this._towerValue = GetUnitGoldCost(this.GetTypeID());
        this._fullRefundValue = this._towerValue;
        this._fullRefundPhase = game.worldMap.gameRoundHandler?.isWaveInProgress ? PAID_DURING_WAVE : game.buildPhase;
        owner.AddTower(this);
    }

    public GetName(): string {
        return this._unit.name;
    }

    public GetTypeID(): number {
        return this._unit.typeId;
    }

    public GetRectangle(): Rectangle {
        const x: number = this._unit.x;
        const y: number = this._unit.y;
        return new Rectangle([x - 64, y - 64, x + 64, y + 64]);
    }

    public get towerValue(): number {
        return this._towerValue;
    }

    public set towerValue(value: number) {
        this._towerValue = value;
    }

    public get game(): WarcraftMaul {
        return this._game;
    }

    public get UniqueID(): number {
        return this._UniqueID;
    }

    public get owner(): Defender {
        return this._owner;
    }

    public get unit(): Unit {
        return this._unit;
    }

    public get leaverOwned(): boolean {
        return this._leaverOwned;
    }

    public set leaverOwned(value: boolean) {
        this._leaverOwned = value;
    }

    public Upgrade(newTypeId: number): Tower {
        this.Sell();
        const u = ReplaceUnit(this.unit, newTypeId)!;
        const newTower: Tower = this.game.worldMap.towerConstruction.SetupTower(u, this.owner);
        newTower._towerValue += this._towerValue;
        newTower._fullRefundValue += this.refundableValue;
        return newTower;
    }

    public IsEndOfRoundTower(): this is EndOfRoundTower {
        return 'EndOfRoundAction' in this;
    }

    public IsAttackActionTower(): this is AttackActionTower {
        return 'AttackAction' in this;
    }


    public IsInitialDamageModificationTower(): this is InitialDamageModificationTower {
        return 'InitialDamageModification' in this;
    }

    public IsGenericAutoAttackTower(): this is GenericAutoAttackTower {
        return 'GenericAttack' in this;
    }

    public IsKillingActionTower(): this is KillingActionTower {
        return 'KillingAction' in this;
    }


    public IsAreaEffectTower(): this is PassiveCreepDiesInAreaEffectTower {
        return 'PassiveCreepDiesInAreaEffect' in this;
    }

    public IsTowerForceTower(): this is TowerForce {
        return 'UpdateSize' in this;
    }

    public IsConstructActionTower(): this is ConstructActionTower {
        return 'ConstructionFinished' in this;
    }

    public IsSellActionTower(): this is SellActionTower {
        return 'SellAction' in this;
    }

    public IsLimitedTower(): this is LimitedTower {
        return 'MaxCount' in this;
    }

    public IsTickingTower(): this is TickingTower {
        return 'GetTickModulo' in this;
    }

    public Sell(): void {

        if (this.IsEndOfRoundTower() && this.game.worldMap.gameRoundHandler) {
            this.game.worldMap.gameTurn.RemoveEndOfRoundTower(this.UniqueID);
        }
        if (this.IsAttackActionTower()) {
            this.game.gameDamageEngine.initialDamageEventTowers.delete(this.UniqueID);
        }
        if (this.IsTickingTower()) {
            this.game.towerTicker.RemoveTickingTower(this.UniqueID);
        }
        if (this.IsInitialDamageModificationTower()) {
            this.game.gameDamageEngine.initialDamageModificationEventTowers.delete(this.UniqueID);
        }
        if (this.IsGenericAutoAttackTower()) {
            this.game.worldMap.towerConstruction.genericAttacks.delete(this.UniqueID);
        }
        if (this.IsKillingActionTower()) {
            this.game.worldMap.towerConstruction.killingActions.delete(this.UniqueID);
        }
        if (this.IsSellActionTower()) {
            this.SellAction();
        }
        if (this.IsTowerForceTower()) {
            if (this.owner.towerForces.has(this.GetTypeID())) {
                this.owner.towerForces.set(this.GetTypeID(), <number>this.owner.towerForces.get(this.GetTypeID()) - 1);
                for (const towerx of this.owner.towersArray) {
                    if (towerx.IsTowerForceTower() && towerx.GetTypeID === this.GetTypeID) {
                        towerx.UpdateSize();
                    }
                }
            }
        }
        if (this.IsAreaEffectTower()) {
            let area: number | undefined;

            for (let i: number = 0; i < this.game.mapSettings.PLAYER_AREAS.length; i++) {
                if (this.game.mapSettings.PLAYER_AREAS[i].ContainsUnit(this.unit)) {
                    area = i;
                    break;
                }
            }
            if (area) {
                this.game.worldMap.playerSpawns[area].areaTowers.delete(this.UniqueID);
            } else {
                Log.Fatal(`${this._unit.name} built outside of requires area, unable to remove. Please screenshot and report`);
            }
        }
        this.owner.RemoveTower(this.UniqueID);

    }

    /**
     * Moves the standing tower to another cell, keeping the unit and everything on it
     * (attached effects, buffs, ability levels, tower state). SetUnitPosition re-places a
     * building's pathing footprint, unlike SetUnitX/Y. The area-effect registration follows
     * the unit into the new lane. Returns false when the unit did not land on (x, y).
     */
    public Relocate(x: number, y: number): boolean {
        const from = this.areaIndex();
        this._unit.setPosition(x, y);
        if (Math.abs(this._unit.x - x) > 1 || Math.abs(this._unit.y - y) > 1) {
            return false;
        }
        const to = this.areaIndex();
        if (this.IsAreaEffectTower() && from !== to) {
            if (from !== undefined) {
                this.game.worldMap.playerSpawns[from].areaTowers.delete(this.UniqueID);
            }
            if (to !== undefined) {
                this.game.worldMap.playerSpawns[to].areaTowers.set(this.UniqueID, this);
            }
        }
        return true;
    }

    private areaIndex(): number | undefined {
        const index = this.game.mapSettings.PLAYER_AREAS.findIndex(area => area.ContainsUnit(this._unit));
        return index === -1 ? undefined : index;
    }

    public CastSpellOnAttackedUnitLocation(spell: string): void {
        const attackedUnit = Unit.fromEvent()!;
        const attacker = Unit.fromHandle(GetAttacker())!;
        attacker?.issueOrderAt(spell, attackedUnit.x, attackedUnit.y);
    }

    public SetOwnership(newOwner: Defender): Tower {
        this._unit.setOwner(newOwner, true);
        this.Sell();
        const newTower: Tower = this.game.worldMap.towerConstruction.SetupTower(this.unit, newOwner);
        newTower._towerValue = this._towerValue;
        newTower._fullRefundValue = this._fullRefundValue;
        newTower._fullRefundPhase = this._fullRefundPhase;
        return newTower;
    }

    public GetSellValue(): number {
        return this.towerValue;
    }

    /** Gold spent on this tower in the build phase that is still running; 0 once a wave has started. */
    public get refundableValue(): number {
        return this._fullRefundPhase === this._game.buildPhase ? this._fullRefundValue : 0;
    }

    /** Carries still-refundable gold onto this tower: an upgrade keeps what its predecessor cost. */
    public AddRefundableValue(value: number): void {
        this._fullRefundValue += value;
    }

    /**
     * Gold for selling this tower: what it cost in the build phase still running comes back in
     * full, so towers can be rearranged freely between waves; the rest at the sell rate.
     */
    public GetSellRefund(): number {
        const full: number = this.refundableValue;
        return Util.Round(full + (this._towerValue - full) * settings.SELL_REFUND_RATE);
    }

    public Remove(): void {
        this.Sell();
        if (this.game.worldMap.gameRoundHandler && this.game.worldMap.gameRoundHandler.isWaveInProgress) {

            const antijuggle: AntiJuggleTower = new AntiJuggleTower(this._game, this);
        }
        this._unit.destroy();
    }

    /**
     * Helper Functions for TickingTower
     */
    public IsTargetTick(currentTick: number, modulo: number): boolean {
        if (!this.IsTickingTower()) {
            Log.Debug(`${this.GetName()} is not a ticking tower`);
            return false;
        }
        if (this.targetTick === undefined) {
            this.SetTargetTick(currentTick, modulo);
            return false;
        }
        if (currentTick >= this.targetTick) {
            this.SetTargetTick(currentTick, modulo);
            return true;
        }
        return false;
    }

    private SetTargetTick(currentTick: number, modulo: number): void {
        if (!this.IsTickingTower()) {
            Log.Debug(`${this.GetName()} is not a ticking tower`);
            return;
        }
        this.targetTick = (currentTick + this.GetTickModulo()) % modulo;
    }

    /**
     * End Helper Functions for TickingTower
     */


    public isPaused(): boolean {
        return this._unit.paused;
    }
}
