import { DamageEngineGlobals } from './DamageEngineGlobals';
import { AttackActionTower } from '../Entity/Tower/Specs/AttackActionTower';
import { DamageModificationBuff } from '../Entity/Buff/Specs/DamageModificationBuff';
import { AttackActionBuff } from '../Entity/Buff/Specs/AttackActionBuff';
import { InitialDamageModificationTower } from '../Entity/Tower/Specs/InitialDamageModificationTower';
import { FinalDamageModificationCreepAbility } from '../Entity/CreepAbilities/specs/FinalDamageModificationCreepAbility';
import { AttackActionCreepAbility } from '../Entity/CreepAbilities/specs/AttackActionCreepAbility';
import { DamageEngine as Engine, DamageEventType, DamageInstance } from '../../lib/DamageEngine/DamageEngine';

// The pure damage type: only the initial modifications run on it
const TYPE_PURE = 2;

/**
 * The map's damage hooks, run by Damage Engine 5.A (src/lib/DamageEngine). Until 2026-10 the map
 * ran Damage Engine 5.3.0.1 (git tag damage-engine-5.3.0.1); this keeps its API, so the towers,
 * buffs, abilities and creep abilities that hook in, and the udg_ globals they read, are as they
 * were:
 *
 * - before armor (5.A's pre-damage event): a tower's initial damage modification, then the
 *   multiplicative modifications and the pre-final ones (not for pure damage); what they change in
 *   the globals (the amount, the attack, damage and weapon types, armor) goes into the damage;
 * - after armor, when there is damage (the armor event): the final modifications; the amount;
 * - then, unless the damage type is unknown (the on-damage event): the on-hit actions of the
 *   source tower, the buffs, the abilities and the creep abilities, reading the final amount;
 * - zero-damage, after-damage, lethal and area events, registered with 5.A only once something is
 *   added to them (a lethal event costs a life lookup on every hit). The area event runs, as it
 *   did, when an attack hit more than one unit.
 *
 * udg_IsDamageSpell keeps its old meaning, the attack type being "spells", which 5.A's isSpell
 * narrows to damage that is not an attack.
 */
export class DamageEngine {
    public initialDamageEventTowers: Map<number, AttackActionTower> = new Map<number, AttackActionTower>();
    public initialDamageModificationEventTowers: Map<number, InitialDamageModificationTower> =
        new Map<number, InitialDamageModificationTower>();
    public initialDamageEventBuffs: AttackActionBuff[] = [];
    public initialDamageEventAbilities: AttackActionAbility[] = [];
    public initialDamageEventCreepAbilities: AttackActionCreepAbility[] = [];
    public multiplicativeDamageModificationEventBuff: DamageModificationBuff[] = [];

    private readonly initialDamageEvent: (() => void)[] = [];
    private readonly zeroDamageEvent: (() => void)[] = [];
    private readonly damageEventAOEActions: (() => void)[] = [];
    private readonly damageEventLethalActions: (() => void)[] = [];
    private readonly initialDamageModificationEvent: (() => void)[] = [];
    private readonly multiplicativeDamageModificationEvent: (() => void)[] = [];
    private readonly preFinalDamageModificationEvent: (() => void)[] = [];
    private readonly finalDamageModificationEvent: (() => void)[] = [];
    private readonly finalDamageModificationCreepAbilities: FinalDamageModificationCreepAbility[] = [];
    private readonly afterDamageEvent: (() => void)[] = [];

    private readonly engine: Engine;
    // The 5.A events registered on demand
    private readonly registered: Set<DamageEventType> = new Set<DamageEventType>();

    constructor(private readonly damageEngineGlobals: DamageEngineGlobals) {
        this.engine = new Engine();
        damageEngineGlobals.udg_DamageEventAOEGroup = Engine.targets;
        Engine.register({event: d => this.beforeArmor(d)}, DamageEventType.PreDamageEvent);
        Engine.register({event: d => this.afterArmor(d)}, DamageEventType.ArmorDamageEvent);
        Engine.register({event: d => this.onHit(d)}, DamageEventType.OnDamageEvent);
    }

    /** Runs right after a unit takes damage, unless its type is unknown; do not change the damage. */
    public AddInitialDamageEvent(event: () => void): void {
        this.initialDamageEvent.push(event);
    }

    /** A tower's on-hit action, run for its own damage; do not change the damage. */
    public AddInitialDamageEventTower(handleId: number, tower: AttackActionTower): void {
        this.initialDamageEventTowers.set(handleId, tower);
    }

    public AddInitialDamageEventBuff(buff: AttackActionBuff): void {
        this.initialDamageEventBuffs.push(buff);
    }

    public AddInitialDamageEventAbility(ability: AttackActionAbility): void {
        this.initialDamageEventAbilities.push(ability);
    }

    public AddInitialDamageEventCreepAbility(ability: AttackActionCreepAbility): void {
        this.initialDamageEventCreepAbilities.push(ability);
    }

    /** Runs when a unit takes 0 damage. */
    public AddZeroDamageEvent(event: () => void): void {
        this.zeroDamageEvent.push(event);
        this.registerOnDemand(DamageEventType.ZeroDamageEvent, d => this.run(d, this.zeroDamageEvent));
    }

    /** Adds or subtracts damage before armor. */
    public AddInitialDamageModificationEvent(event: () => void): void {
        this.initialDamageModificationEvent.push(event);
    }

    /** A tower's change to its own damage, before armor. */
    public AddInitialDamageModificationEventTower(handleId: number, tower: InitialDamageModificationTower): void {
        this.initialDamageModificationEventTowers.set(handleId, tower);
    }

    /** Multiplies damage before armor. */
    public AddMultiplicativeDamageModificationEvent(event: () => void): void {
        this.multiplicativeDamageModificationEvent.push(event);
    }

    public AddMultiplicativeDamageModificationEventBuff(buff: DamageModificationBuff): void {
        this.multiplicativeDamageModificationEventBuff.push(buff);
    }

    /** Changes damage last before armor and resistance. */
    public AddPreFinalDamageModificationEvent(event: () => void): void {
        this.preFinalDamageModificationEvent.push(event);
    }

    /** Runs before a unit takes lethal damage; udg_LethalDamageHP may be raised to spare it. */
    public AddLethalDamageEvent(event: () => void): void {
        this.damageEventLethalActions.push(event);
        this.registerOnDemand(DamageEventType.LethalDamageEvent, d => this.lethal(d));
    }

    /** Runs once an attack has hit more than one unit. */
    public AddAOEDamageEvent(event: () => void): void {
        this.damageEventAOEActions.push(event);
        this.registerOnDemand(DamageEventType.AoeDamageEvent, d => this.areaDamage(d));
    }

    /** Changes damage after armor and resistance. */
    public AddFinalDamageModificationEvent(event: () => void): void {
        this.finalDamageModificationEvent.push(event);
    }

    public AddFinalDamageModificationCreepAbility(ability: FinalDamageModificationCreepAbility): void {
        this.finalDamageModificationCreepAbilities.push(ability);
    }

    /** Runs after damage has been dealt. */
    public AddAfterDamageEvent(event: () => void): void {
        this.afterDamageEvent.push(event);
        this.registerOnDemand(DamageEventType.AfterDamageEvent, d => this.run(d, this.afterDamageEvent));
    }

    private registerOnDemand(type: DamageEventType, event: (this: void, d: DamageInstance) => void): void {
        if (!this.registered.has(type)) {
            this.registered.add(type);
            Engine.register({event}, type);
        }
    }

    private beforeArmor(d: DamageInstance): void {
        const globals = this.damageEngineGlobals;
        this.load(d);
        const tower = this.initialDamageModificationEventTowers.get(GetHandleId(d.source));
        if (tower) {
            tower.InitialDamageModification();
        }
        this.initialDamageModificationEvent.forEach(action => action());
        if (globals.udg_DamageEventType !== TYPE_PURE && globals.udg_DamageEventType !== -TYPE_PURE) {
            this.multiplicativeDamageModificationEvent.forEach(action => action());
            this.multiplicativeDamageModificationEventBuff.forEach(buff => buff.ModifyDamage());
            this.preFinalDamageModificationEvent.forEach(action => action());
        }
        this.store(d);
    }

    private afterArmor(d: DamageInstance): void {
        this.load(d);
        this.finalDamageModificationEvent.forEach(action => action());
        this.finalDamageModificationCreepAbilities.forEach(ability => ability.ModifyFinalDamage());
        d.damage = this.damageEngineGlobals.udg_DamageEventAmount;
    }

    private onHit(d: DamageInstance): void {
        this.load(d);
        const tower = this.initialDamageEventTowers.get(GetHandleId(d.source));
        if (tower) {
            tower.AttackAction();
        }
        this.initialDamageEvent.forEach(action => action());
        this.initialDamageEventBuffs.forEach(buff => buff.AttackAction());
        this.initialDamageEventAbilities.forEach(ability => ability.AttackAction());
        this.initialDamageEventCreepAbilities.forEach(ability => ability.AttackAction());
    }

    private lethal(d: DamageInstance): void {
        this.load(d);
        this.damageEngineGlobals.udg_LethalDamageHP = d.life;
        this.damageEventLethalActions.forEach(action => action());
        d.life = this.damageEngineGlobals.udg_LethalDamageHP;
    }

    /** The area event runs as a series ends, when there may be no instance left. */
    private areaDamage(d: DamageInstance | null): void {
        if (this.engine.aoeCount <= 1) {
            return;
        }
        if (d) {
            this.load(d);
        } else {
            this.loadSeries();
        }
        this.damageEventAOEActions.forEach(action => action());
    }

    private run(d: DamageInstance, actions: (() => void)[]): void {
        this.load(d);
        actions.forEach(action => action());
    }

    /** The globals for one damage instance, as the events read them. */
    private load(d: DamageInstance): void {
        const globals = this.damageEngineGlobals;
        globals.udg_DamageEventSource = d.source;
        globals.udg_DamageEventTarget = d.target;
        globals.udg_DamageEventAmount = d.damage;
        globals.udg_DamageEventPrevAmt = d.prevAmt;
        globals.udg_DamageEventAttackT = GetHandleId(d.attackType);
        globals.udg_DamageEventDamageT = GetHandleId(d.damageType);
        globals.udg_DamageEventWeaponT = GetHandleId(d.weaponType);
        globals.udg_DamageEventArmorT = d.armorType;
        globals.udg_DamageEventDefenseT = d.defenseType;
        globals.udg_DamageEventArmorPierced = d.armorPierced;
        globals.udg_DamageEventType = d.userType;
        globals.udg_IsDamageCode = d.isCode;
        globals.udg_IsDamageSpell = globals.udg_DamageEventAttackT === 0;
        globals.udg_IsDamageMelee = d.isMelee;
        globals.udg_IsDamageRanged = d.isRanged;
        this.loadSeries();
    }

    private loadSeries(): void {
        const globals = this.damageEngineGlobals;
        globals.udg_DamageEventAOE = this.engine.aoeCount;
        globals.udg_DamageEventLevel = this.engine.sourceStacks;
        globals.udg_AOEDamageSource = this.engine.aoeSource;
        globals.udg_EnhancedDamageTarget = this.engine.aoeFirstTarget;
    }

    /** What a modification event may have changed in the globals, back into the damage. */
    private store(d: DamageInstance): void {
        const globals = this.damageEngineGlobals;
        d.damage = globals.udg_DamageEventAmount;
        if (globals.udg_DamageEventAttackT !== GetHandleId(d.attackType)) {
            d.attackType = ConvertAttackType(globals.udg_DamageEventAttackT)!;
        }
        if (globals.udg_DamageEventDamageT !== GetHandleId(d.damageType)) {
            d.damageType = ConvertDamageType(globals.udg_DamageEventDamageT)!;
        }
        if (globals.udg_DamageEventWeaponT !== GetHandleId(d.weaponType)) {
            d.weaponType = ConvertWeaponType(globals.udg_DamageEventWeaponT)!;
        }
        d.armorType = globals.udg_DamageEventArmorT;
        d.defenseType = globals.udg_DamageEventDefenseT;
        d.armorPierced = globals.udg_DamageEventArmorPierced;
    }
}
