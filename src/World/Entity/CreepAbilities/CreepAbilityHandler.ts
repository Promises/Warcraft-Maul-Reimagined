import { WarcraftMaul } from '../../WarcraftMaul';
import { CreepAbility } from './specs/CreepAbility';
import { DivineShield } from './DivineShield';
import { CrippleAura } from './CrippleAura';
import { WaveCreep } from '../WaveCreep';
import { VampiricAura } from './VampiricAura';
import { WalkItOff } from './WalkItOff';
import { HardnedSkin } from './HardnedSkin';
import { Evasion } from './Evasion';
import { ArmorBonus } from './ArmorBonus';
import { SpellShield } from './SpellShield';
import { TornadoAura } from './TornadoAura';
import { MorningPerson } from './MorningPerson';
import {Unit} from "w3ts";
import {CREEP_TYPE, Util} from "../../../lib/translators";

export class CreepAbilityHandler {
    private game: WarcraftMaul | undefined;
    private abilities: Array<new (abilityUnit: Unit) => CreepAbility> = [];
    private activeAbilities: CreepAbility[] = [];


    constructor(abilityUnit: Unit) {
        this.AddAbilitiesToList();
        this.PreSetupAbilities(abilityUnit);
    }


    private AddAbilitiesToList(): void {
        this.abilities.push(HardnedSkin);
        this.abilities.push(Evasion);
        this.abilities.push(ArmorBonus);
        this.abilities.push(CrippleAura);
        this.abilities.push(SpellShield);
        this.abilities.push(TornadoAura);
        this.abilities.push(VampiricAura);
        this.abilities.push(DivineShield);
        this.abilities.push(WalkItOff);
        this.abilities.push(MorningPerson);
    }


    private PreSetupAbilities(abilityUnit: Unit): void {

        for (const ability of this.abilities) {
            const ObjectExtendsAbility: CreepAbility = new ability(abilityUnit);

            this.activeAbilities.push(ObjectExtendsAbility);
        }

    }

    public SetupGame(game: WarcraftMaul): void {
        this.game = game;
        this.SetupAbilities();
    }

    private SetupAbilities(): void {
        if (!this.game) {
            return;
        }
        for (const ability of this.activeAbilities) {
            ability.SetupGame(this.game);

            if (ability.IsFinalDamageModificationCreepAbility()) {
                this.game.gameDamageEngine.AddFinalDamageModificationCreepAbility(ability);
            }

            if (ability.IsAttackActionCreepAbility()) {
                this.game.gameDamageEngine.AddInitialDamageEventCreepAbility(ability);
            }


        }

    }

    public GetAbilitiesForWave(wave: WaveCreep): CreepAbility[] {
        if (!this.game) {
            return this.activeAbilities;
        }
        // Scaling (adaptive) difficulty: abilities are their own team-wide axis, so the count comes
        // straight from the engine, decoupled from the HP percent.
        const engine = this.game.adaptiveDifficulty;
        if (engine) {
            return this.pickAbilities(wave, engine.abilityLevelForWave());
        }
        // Flat difficulty: one ability per 100% above Normal, plus a fractional-% chance of one more.
        // 100% (Normal) gives none, and so does anything below it: a game whose difficulty is never
        // set sits at 0% (Vote.ts), and without this guard the maths goes negative and hands back
        // nearly every ability. Nothing under Normal adds any.
        let currentDiff: number = this.game.diffVote.difficulty;
        if (currentDiff <= 100) {
            return [];
        }
        currentDiff -= 100;
        let picks: number = Math.floor(currentDiff / 100);
        const rest: number = currentDiff % 100;
        if (Util.RandomInt(1, 100) <= rest) {
            picks++;
        }
        return this.pickAbilities(wave, picks);
    }

    /**
     * `picks` random abilities for a non-boss creep (a boss always gets every ability). The pool is
     * shuffled with the synced RNG, so every client picks the same set.
     */
    private pickAbilities(wave: WaveCreep, picks: number): CreepAbility[] {
        const allAbilities: CreepAbility[] = this.activeAbilities.slice(0);
        if (wave.getCreepType() === CREEP_TYPE.BOSS) {
            return allAbilities;
        }
        if (picks <= 0) {
            return [];
        }
        this.ShuffleArray(allAbilities);
        return allAbilities.slice(0, Math.min(picks, allAbilities.length));
    }

    private ShuffleArray(arr: any[]): void {
        for (let i: number = arr.length - 1; i > 0; i--) {
            const j: number = GetRandomInt(0, i); // random index from 0 to i
            // [arr[i], arr[j]] = [arr[j], arr[i]]; // swap elements

            const temp: any = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
}
