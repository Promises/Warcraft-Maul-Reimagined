/**
 * Lua Damage Engine 2.0 (Damage Engine 5.A.0.0) by Bribe, ported to TypeScript by runi95 for
 * scourge-survival (github.com/runi95/scourge-survival, src/Utility/DamageEngine, MIT license),
 * taken 2026-10-09 at its 2026-09-23 version. Changes for Warcraft Maul:
 *
 * - Zero-damage events are handled as the original engine handles them (an instance of their
 *   own, the zero-damage event, then done); the port's hotfix that dropped them is gone. The game
 *   fires every DAMAGING straight before its own DAMAGED, zero-damage ones included (measured:
 *   test_damage_event_order_probe in wc3-slop-lan), so what broke there was the DAMAGED event
 *   after a finished instance reading `current` once it was cleared: DAMAGED now returns when
 *   there is no instance.
 * - The area counting (`_USE_EXTRA`) is on, and readable: aoeCount, sourceStacks, aoeSource,
 *   aoeFirstTarget (the map's udg_DamageEventAOE and the like).
 * - The immune tables are looked up by handle id (the port looked them up by the handle itself,
 *   which never matched); the units hit in a series are kept in sets.
 * - One reused timer for the end of a series, in place of the port's TimerUtils.
 * - No debug logging on every event; the instance transformer is optional; Damage.apply and the
 *   like, which the port never had, are left out.
 */
import type { DamageEvent } from './DamageEvent';

type TransformerFunc = (d: DamageInstance) => DamageInstance;

export enum DamageEventType {
    PreDamageEvent,
    ArmorDamageEvent,
    ZeroDamageEvent,
    OnDamageEvent,
    AfterDamageEvent,
    LethalDamageEvent,
    AoeDamageEvent,
}

interface DamageEventRegistry {
    minAOE: null | number;
    filters: {[key: number]: boolean};
    levelsDeep: number;
    trigFrozen: null | boolean;
    configured: boolean;
    inceptionTrig: boolean;
    damageEvent: DamageEvent;
}

export interface DamageInstance {
    source: unit;
    target: unit;
    damage: number;
    prevAmt: number;
    isAttack: boolean;
    isRanged: boolean;
    isMelee: boolean;
    attackType: attacktype;
    damageType: damagetype;
    weaponType: weapontype;
    isCode: boolean;
    isSpell: boolean;
    recursiveFunc: DamageEventRegistry | null;
    userType: number;
    armorPierced: number;
    prevArmorT: number;
    armorType: number;
    prevDefenseT: number;
    defenseType: number;
    userAmt: number;
    eFilter: number;
    /** Only set on lethal damage events */
    life: number;
}

type MappedEventsObject = {[Property in DamageEventType]: DamageEventRegistry[]};

export class DamageEngine {
    public static nextType: number = 0;
    public static readonly targets: group = CreateGroup()!;

    private static readonly _LIMBO: number = 16; // How deep manually-enabled recursion may go
    private static readonly _DEATH_VAL: number = 0.405;

    private static readonly _TYPE_CODE: number = 1; // udg_DamageTypeCode
    private static readonly _TYPE_PURE: number = 2; // udg_DamageTypePure

    // Blizzard's "limitop" values
    private static readonly _FILTER_ATTACK: number = 0;
    private static readonly _FILTER_MELEE: number = 1;
    private static readonly _FILTER_OTHER: number = 2;
    private static readonly _FILTER_RANGED: number = 3;
    private static readonly _FILTER_SPELL: number = 4;
    private static readonly _FILTER_CODE: number = 5;

    private static HAS_LETHAL: boolean = false;
    private static DAMAGE_INSTANCE_TRANSFORMER: TransformerFunc | undefined;
    private static readonly EVENTS: MappedEventsObject = {
        [DamageEventType.PreDamageEvent]: [],
        [DamageEventType.ArmorDamageEvent]: [],
        [DamageEventType.LethalDamageEvent]: [],
        [DamageEventType.OnDamageEvent]: [],
        [DamageEventType.AfterDamageEvent]: [],
        [DamageEventType.ZeroDamageEvent]: [],
        [DamageEventType.AoeDamageEvent]: [],
    };

    private readonly t1: trigger = CreateTrigger()!;
    private readonly t2: trigger = CreateTrigger()!;
    private readonly t3: trigger = CreateTrigger()!;
    private readonly alarm: timer = CreateTimer()!;
    private current: DamageInstance | null = null;
    // The registry of the damage function now running
    private userIndex: DamageEventRegistry | null = null;

    // How many times one unit was hit by one source with one attack (udg_DamageEventLevel), and how
    // many units it hit (udg_DamageEventAOE)
    private stacks: number = 1;
    private hitCount: number = 1;
    // The source that began the current series of damage events (udg_AOEDamageSource), and the
    // first unit it hit (udg_EnhancedDamageTarget)
    private originalSource: unit | undefined;
    private originalTarget: unit | undefined;

    private isDreaming: boolean = false;
    private canOverride: boolean = false;
    private isAlarmSet: boolean = false;
    private canKick: boolean = true;
    private sleepLevel: number = 0;
    private totem: boolean = false;
    private isKicking: boolean = false;
    private isEventsRun: boolean = false;
    private prepped: DamageInstance | null = null;
    private recursiveStack: DamageInstance[] = [];
    private lastInstance: DamageInstance | null = null;
    private sourcesHit: Set<unit> = new Set<unit>();
    private targetsHit: Set<unit> = new Set<unit>();

    // By attack type and damage type handle id: those a magic immune unit is not immune to
    private readonly attacksImmune: {[id: number]: boolean} = {0: false, 1: true, 2: true, 3: true, 4: false, 5: true, 6: true};
    private readonly damagesImmune: {[id: number]: boolean} = {
        0: true, 4: true, 5: true, 8: false, 9: false, 10: false, 11: true, 12: true, 13: false, 14: false, 15: false,
        16: true, 17: false, 18: false, 19: false, 20: false, 21: false, 22: true, 23: true, 24: false, 25: false, 26: true,
    };

    private readonly breakCheck: {[type: number]: () => boolean} = {
        [DamageEventType.PreDamageEvent]: () => this.canOverride || this.current!.userType === DamageEngine._TYPE_PURE,
        [DamageEventType.ArmorDamageEvent]: () => this.current!.damage <= 0.0,
        [DamageEventType.LethalDamageEvent]: () => DamageEngine.HAS_LETHAL && this.current!.life > DamageEngine._DEATH_VAL,
        [DamageEventType.OnDamageEvent]: () => this.damageOrAfter(),
        [DamageEventType.AfterDamageEvent]: () => this.damageOrAfter(),
    };

    constructor() {
        TriggerRegisterAnyUnitEventBJ(this.t1, EVENT_PLAYER_UNIT_DAMAGING);
        TriggerAddCondition(this.t1, Filter(() => {
            const d = this.createFromEvent(GetEventDamage(), false);
            if (this.isAlarmSet) {
                if (this.totem) {
                    // WarCraft 3 did not run the DAMAGED event despite running the DAMAGING event
                    if (d.damageType === DAMAGE_TYPE_SPIRIT_LINK || d.damageType === DAMAGE_TYPE_DEFENSIVE
                        || d.damageType === DAMAGE_TYPE_PLANT) {
                        this.lastInstance = this.current;
                        this.totem = false;
                        this.canKick = false;
                    } else {
                        // Not an overlapping event: wrap it up
                        this.failsafeClear();
                    }
                } else {
                    // Wrap up any previous damage index
                    this.finish();
                }
                if (d.source !== this.originalSource) {
                    this.onAOEEnd();
                    this.originalSource = d.source;
                    this.originalTarget = d.target;
                } else if (d.target === this.originalTarget) {
                    this.stacks += 1;
                } else if (!IsUnitInGroup(d.target, DamageEngine.targets)) {
                    this.hitCount += 1;
                }
            } else {
                this.isAlarmSet = true;
                TimerStart(this.alarm, 0.0, false, () => this.onAlarm());
                this.originalSource = d.source;
                this.originalTarget = d.target;
            }
            GroupAddUnit(DamageEngine.targets, d.target);
            if (this.doPreEvents(d, true)) {
                this.runEvent(DamageEventType.ZeroDamageEvent);
                this.canKick = true;
                this.finish();
            }
            this.totem = this.lastInstance === null
                || this.attacksImmune[GetHandleId(d.attackType)] === true
                || this.damagesImmune[GetHandleId(d.damageType)] === true
                || !IsUnitType(d.target, UNIT_TYPE_MAGIC_IMMUNE);
            return false;
        }));

        TriggerRegisterAnyUnitEventBJ(this.t2, EVENT_PLAYER_UNIT_DAMAGED);
        TriggerAddCondition(this.t2, Filter(() => {
            const r = GetEventDamage();
            let d = this.current;
            if (this.prepped) {
                this.prepped = null;
            } else if (this.isDreaming || d === null || d.prevAmt === 0.0) {
                // A zero-damage instance (already finished), or none
                return false;
            } else if (this.totem) {
                this.totem = false;
            } else {
                this.afterDamage();
                d = this.lastInstance;
                this.current = d;
                this.lastInstance = null;
                this.canKick = true;
            }
            if (d === null) {
                return false;
            }
            this.setArmor(true);
            d.userAmt = d.damage;
            d.damage = r;

            if (r > 0.0) {
                this.runEvent(DamageEventType.ArmorDamageEvent);
                if (DamageEngine.HAS_LETHAL || d.userType < 0) {
                    d.life = GetWidgetLife(d.target) - d.damage;
                    if (d.life <= DamageEngine._DEATH_VAL) {
                        if (DamageEngine.HAS_LETHAL) {
                            this.runEvent(DamageEventType.LethalDamageEvent);
                            d.damage = GetWidgetLife(d.target) - d.life;
                        }
                        if (d.userType < 0 && d.life <= DamageEngine._DEATH_VAL) {
                            SetUnitExploded(d.target, true);
                        }
                    }
                }
            }
            if (d.damageType !== DAMAGE_TYPE_UNKNOWN) {
                this.runEvent(DamageEventType.OnDamageEvent);
            }
            BlzSetEventDamage(d.damage);
            this.isEventsRun = true;
            if (d.damage === 0.0) {
                this.finish();
            }
            return false;
        }));

        TriggerRegisterAnyUnitEventBJ(this.t3, EVENT_PLAYER_UNIT_DAMAGING);
        TriggerAddCondition(this.t3, Filter(() => {
            this.addRecursive(this.createFromEvent(GetEventDamage(), true));
            BlzSetEventDamage(0.0);
            return false;
        }));
        DisableTrigger(this.t3);
    }

    /** How many units the current source has hit with this attack (udg_DamageEventAOE). */
    public get aoeCount(): number {
        return this.hitCount;
    }

    /** How many times the current target was hit by the source with this attack (udg_DamageEventLevel). */
    public get sourceStacks(): number {
        return this.stacks;
    }

    /** The source that began the current series of damage events (udg_AOEDamageSource). */
    public get aoeSource(): unit | undefined {
        return this.originalSource;
    }

    /** The first unit the source hit in the current series (udg_EnhancedDamageTarget). */
    public get aoeFirstTarget(): unit | undefined {
        return this.originalTarget;
    }

    /** Enables or disables the engine. */
    public enable(on: boolean): void {
        if (on) {
            if (this.isDreaming) {
                EnableTrigger(this.t3);
            } else {
                EnableTrigger(this.t1);
                EnableTrigger(this.t2);
            }
        } else if (this.isDreaming) {
            DisableTrigger(this.t3);
        } else {
            DisableTrigger(this.t1);
            DisableTrigger(this.t2);
        }
    }

    /** Lets the damage function now running deal damage that runs the events again (to _LIMBO deep). */
    public inception(): void {
        if (this.userIndex) {
            this.userIndex.inceptionTrig = true;
        }
    }

    public static registerTransformer(transformer: TransformerFunc): void {
        DamageEngine.DAMAGE_INSTANCE_TRANSFORMER = transformer;
    }

    /** Registers a damage event; filt narrows it to attacks, melee, ranged, spells or code damage. */
    public static register(damageEvent: DamageEvent, eventType: DamageEventType, filt?: number): void {
        if (eventType === DamageEventType.LethalDamageEvent) {
            DamageEngine.HAS_LETHAL = true;
        }
        const filter = filt ?? DamageEngine._FILTER_OTHER;
        const filters: {[key: number]: boolean} = {};
        if (filter === DamageEngine._FILTER_OTHER) {
            for (const f of [DamageEngine._FILTER_ATTACK, DamageEngine._FILTER_MELEE, DamageEngine._FILTER_OTHER,
                DamageEngine._FILTER_RANGED, DamageEngine._FILTER_SPELL, DamageEngine._FILTER_CODE]) {
                filters[f] = true;
            }
        } else if (filter === DamageEngine._FILTER_ATTACK) {
            filters[DamageEngine._FILTER_ATTACK] = true;
            filters[DamageEngine._FILTER_MELEE] = true;
            filters[DamageEngine._FILTER_RANGED] = true;
        } else {
            filters[filter] = true;
        }
        DamageEngine.EVENTS[eventType].push({
            filters, levelsDeep: 0, damageEvent, trigFrozen: null, configured: false, minAOE: null, inceptionTrig: false,
        });
    }

    private damageOrAfter(): boolean {
        return this.current!.damageType === DAMAGE_TYPE_UNKNOWN;
    }

    /** Runs one kind of event for the current instance; false when it was not run. */
    private runEvent(damageEventType: DamageEventType): boolean {
        const check = this.breakCheck[damageEventType] ?? (() => false);
        if (this.isDreaming || check()) {
            return false;
        }
        const events = DamageEngine.EVENTS[damageEventType];
        if (events.length > 0) {
            this.enable(false);
            EnableTrigger(this.t3);
            this.isDreaming = true;
            const isAoe = damageEventType === DamageEventType.AoeDamageEvent;
            let isFirstEvent = true;
            for (const event of events) {
                this.userIndex = event;
                if (check()) {
                    break;
                }
                // The area event runs as a series ends, when there may be no instance left
                const passes = this.current === null || event.filters[this.current.eFilter] === true;
                if (!event.trigFrozen && passes
                    && (!isAoe || (isFirstEvent && (event.minAOE === null || this.hitCount >= event.minAOE)))) {
                    event.damageEvent.event(this.current!);
                }
                isFirstEvent = false;
            }
            this.isDreaming = false;
            this.enable(true);
            DisableTrigger(this.t3);
        }
        return true;
    }

    /** The damage properties for one event sequence. */
    private create(src: unit, tgt: unit, amt: number, a: boolean, r: boolean, at: attacktype, dt: damagetype,
                   wt: weapontype, fromCode: boolean): DamageInstance {
        const d: DamageInstance = {
            source: src, target: tgt, damage: amt, life: 0, isAttack: a, isRanged: r, attackType: at,
            damageType: dt, weaponType: wt, prevAmt: amt, userAmt: amt, isSpell: at === ATTACK_TYPE_NORMAL && !a,
            isCode: false, isMelee: false, userType: 0, eFilter: DamageEngine._FILTER_OTHER, recursiveFunc: null,
            armorPierced: 0, prevArmorT: 0, armorType: 0, defenseType: 0, prevDefenseT: 0,
        };
        if (fromCode || DamageEngine.nextType !== 0 || d.damageType === DAMAGE_TYPE_MIND
            || (d.damageType === DAMAGE_TYPE_UNKNOWN && d.damage !== 0.0)) {
            d.isCode = true;
            d.userType = DamageEngine.nextType !== 0 ? DamageEngine.nextType : DamageEngine._TYPE_CODE;
            DamageEngine.nextType = 0;
            if (!d.isSpell) {
                d.isMelee = a && !r;
                d.isRanged = a && r;
            }
            d.eFilter = DamageEngine._FILTER_CODE;
        }
        return d;
    }

    /** An instance from an event the game fired. */
    private createFromEvent(eventDamage: number, isCode: boolean): DamageInstance {
        const d = this.create(GetEventDamageSource()!, GetTriggerUnit()!, eventDamage, BlzGetEventIsAttack(), false,
            BlzGetEventAttackType()!, BlzGetEventDamageType()!, BlzGetEventWeaponType()!, isCode);
        if (!d.isCode) {
            if (d.damageType === DAMAGE_TYPE_NORMAL && d.isAttack) {
                d.isMelee = IsUnitType(d.source, UNIT_TYPE_MELEE_ATTACKER);
                d.isRanged = IsUnitType(d.source, UNIT_TYPE_RANGED_ATTACKER);
                if (d.isMelee && d.isRanged) {
                    // Melee units play a sound when damaging; where a unit is both, the ranged attack plays none
                    d.isMelee = GetHandleId(d.weaponType) !== 0;
                    d.isRanged = !d.isMelee;
                }
                if (d.isMelee) {
                    d.eFilter = DamageEngine._FILTER_MELEE;
                } else if (d.isRanged) {
                    d.eFilter = DamageEngine._FILTER_RANGED;
                } else {
                    d.eFilter = DamageEngine._FILTER_ATTACK;
                }
            } else {
                d.eFilter = d.isSpell ? DamageEngine._FILTER_SPELL : DamageEngine._FILTER_OTHER;
            }
        }
        return DamageEngine.DAMAGE_INSTANCE_TRANSFORMER ? DamageEngine.DAMAGE_INSTANCE_TRANSFORMER(d) : d;
    }

    /** The end of a frame's damage: its series is over. */
    private onAlarm(): void {
        this.isAlarmSet = false;
        this.isDreaming = false;
        this.enable(true);
        if (this.totem) {
            // WarCraft 3 did not run the DAMAGED event despite running the DAMAGING event
            this.failsafeClear();
        } else {
            this.canKick = true;
            this.isKicking = false;
            this.finish();
        }
        this.onAOEEnd();
        this.current = null;
    }

    private onAOEEnd(): void {
        this.runEvent(DamageEventType.AoeDamageEvent);
        this.hitCount = 1;
        this.stacks = 1;
        this.originalTarget = undefined;
        this.originalSource = undefined;
        GroupClear(DamageEngine.targets);
    }

    /** Puts on, or (reset) takes off again, the armor changes the events asked for. */
    private setArmor(reset: boolean): void {
        const d = this.current;
        if (d === null) {
            return;
        }
        const pierce = reset ? d.armorPierced : -d.armorPierced;
        const at = reset ? d.prevArmorT : d.armorType;
        const dt = reset ? d.prevDefenseT : d.defenseType;
        if (pierce !== 0.0) {
            BlzSetUnitArmor(d.target, BlzGetUnitArmor(d.target) + pierce);
        }
        if (d.prevArmorT !== d.armorType) {
            BlzSetUnitIntegerField(d.target, UNIT_IF_ARMOR_TYPE, at);
        }
        if (d.prevDefenseT !== d.defenseType) {
            BlzSetUnitIntegerField(d.target, UNIT_IF_DEFENSE_TYPE, dt);
        }
    }

    /** Before the user-facing events; true when the damage is zero. */
    private doPreEvents(d: DamageInstance, isNatural: boolean): boolean {
        d.armorType = BlzGetUnitIntegerField(d.target, UNIT_IF_ARMOR_TYPE);
        d.defenseType = BlzGetUnitIntegerField(d.target, UNIT_IF_DEFENSE_TYPE);
        d.prevArmorT = d.armorType;
        d.prevDefenseT = d.defenseType;
        d.armorPierced = 0.0;
        this.current = d;
        this.sourcesHit.add(d.source);
        this.targetsHit.add(d.target);
        if (d.damage === 0.0) {
            return true;
        }
        this.canOverride = d.damageType === DAMAGE_TYPE_UNKNOWN;
        this.runEvent(DamageEventType.PreDamageEvent);
        if (isNatural) {
            BlzSetEventAttackType(d.attackType);
            BlzSetEventDamageType(d.damageType);
            BlzSetEventWeaponType(d.weaponType);
            BlzSetEventDamage(d.damage);
        }
        this.setArmor(false);
        return false;
    }

    private afterDamage(): void {
        if (this.current) {
            this.runEvent(DamageEventType.AfterDamageEvent);
            this.current = null;
        }
        this.canOverride = false;
    }

    private finish(): void {
        if (this.isEventsRun) {
            this.isEventsRun = false;
            this.afterDamage();
        }
        this.current = null;
        this.canOverride = false;
        if (this.canKick && !this.isKicking) {
            if (this.recursiveStack.length > 0) {
                this.isKicking = true;
                let i = 0;
                let exit: number;
                do {
                    this.sleepLevel += 1;
                    exit = this.recursiveStack.length - 1;
                    do {
                        const prepped = this.recursiveStack[i];
                        this.prepped = prepped;
                        if (UnitAlive(prepped.target)) {
                            // The pre-damage event is not run again
                            this.doPreEvents(prepped, false);
                            if (prepped.damage > 0.0) {
                                // Only the after-armor event runs
                                DisableTrigger(this.t1);
                                EnableTrigger(this.t2);
                                this.totem = true;
                                UnitDamageTarget(prepped.source, prepped.target, prepped.damage, prepped.isAttack,
                                    prepped.isRanged, prepped.attackType, prepped.damageType, prepped.weaponType);
                            } else {
                                this.runEvent(DamageEventType.OnDamageEvent);
                                if (prepped.damage < 0.0) {
                                    SetWidgetLife(prepped.target, GetWidgetLife(prepped.target) - prepped.damage);
                                }
                                this.setArmor(true);
                            }
                            this.afterDamage();
                        }
                        i += 1;
                    } while (i <= exit);
                } while (i < this.recursiveStack.length);
            }
            for (const d of this.recursiveStack) {
                if (d.recursiveFunc) {
                    d.recursiveFunc.trigFrozen = null;
                    d.recursiveFunc.levelsDeep = 0;
                }
            }
            this.recursiveStack = [];
            this.sleepLevel = 0;
            this.prepped = null;
            this.isKicking = false;
            this.isDreaming = false;
            this.enable(true);
            this.sourcesHit = new Set<unit>();
            this.targetsHit = new Set<unit>();
        }
    }

    private failsafeClear(): void {
        if (this.current !== null) {
            this.setArmor(true);
        }
        this.canKick = true;
        this.isKicking = false;
        this.totem = false;
        if (this.current !== null) {
            this.runEvent(DamageEventType.OnDamageEvent);
        }
        this.isEventsRun = true;
        this.finish();
    }

    /** Damage dealt from inside a damage event: held back, and dealt once the event is over. */
    private addRecursive(d: DamageInstance): void {
        if (d.damage === 0.0 || this.userIndex === null) {
            return;
        }
        d.recursiveFunc = this.userIndex;
        if (this.isKicking && this.sourcesHit.has(d.source) && this.targetsHit.has(d.target)) {
            if (!this.userIndex.inceptionTrig) {
                this.userIndex.trigFrozen = true;
            } else if (!this.userIndex.trigFrozen && this.userIndex.levelsDeep < this.sleepLevel) {
                this.userIndex.levelsDeep += 1;
                this.userIndex.trigFrozen = this.userIndex.levelsDeep >= DamageEngine._LIMBO;
            }
        }
        this.recursiveStack.push(d);
    }
}
