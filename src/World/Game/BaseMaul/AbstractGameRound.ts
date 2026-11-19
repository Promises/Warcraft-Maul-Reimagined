import { WarcraftMaul } from '../../WarcraftMaul';
import { WaveCreep } from '../../Entity/WaveCreep';
import { Creep } from '../../Entity/Creep';
import { PlayerSpawns } from '../../Entity/PlayerSpawns';
import { CreepAbility } from '../../Entity/CreepAbilities/specs/CreepAbility';
import { SpawnedCreeps } from '../../Entity/SpawnedCreeps';
import {Trigger} from "w3ts";
import {CREEP_TYPE, DecodeFourCC, SendMessage, Util} from "../../../lib/translators";
import * as settings from '../../GlobalSettings';
import {SyncTrace} from '../../../lib/SyncTrace';

export abstract class AbstractGameRound {


    public readonly game: WarcraftMaul;
    private _isWaveInProgress: boolean = false;
    private _currentWave: number = 1;
    public antiJuggleEnabled: boolean = true;
    private creepMovementTimeout: Trigger;
    // Replaced by a fresh round (-resetgame): its triggers are off and a wave it is spawning stops
    protected retired: boolean = false;

    constructor(game: WarcraftMaul) {
        this.game = game;
        this.creepMovementTimeout = Trigger.create();
        this.creepMovementTimeout.registerTimerEvent(5, true);
        this.creepMovementTimeout.addAction(() => {
            this.VerifyCreepMovement();
        });
    }

    /** The current wave's armour, creep type and level on the scoreboard (every mode, Sandbox too). */
    protected ShowWaveOnScoreboard(): void {
        const board = this.game.scoreBoard;
        if (!board) {
            return;
        }
        const wave = this.game.worldMap.waveCreeps[this.currentWave - 1];
        const armour = settings.ARMOUR_TYPE_NAMES[wave.getArmourType()];
        MultiboardSetItemValueBJ(board.board, 2, 5, Util.ColourString(settings.ARMOUR_TYPE_COLOURS[wave.getArmourType()],
            armour.charAt(0).toUpperCase() + armour.toLowerCase().slice(1)));
        const creepType: CREEP_TYPE = wave.getCreepType();
        if (creepType !== CREEP_TYPE.NORMAL) {
            const name = settings.CREEP_TYPE_NAMES[creepType];
            MultiboardSetItemValueBJ(board.board, 2, 6, Util.ColourString(settings.CREEP_TYPE_COLOURS[creepType],
                `(${name.charAt(0).toUpperCase() + name.toLowerCase().slice(1)})`));
        } else {
            MultiboardSetItemValueBJ(board.board, 2, 6, '');
        }
        MultiboardSetItemValueBJ(board.board, 2, 2, `${this.currentWave}`);
    }

    /** Hands over to a fresh round (ResetGame): no more triggers, and the spawning in progress stops. */
    public retire(): void {
        this.retired = true;
        this.creepMovementTimeout.enabled = false;
    }

    get currentWave(): number {
        return this._currentWave;
    }

    set currentWave(value: number) {
        this._currentWave = value;
    }


    get isWaveInProgress(): boolean {
        return this._isWaveInProgress;
    }

    set isWaveInProgress(value: boolean) {
        // A wave starting ends the build phase: towers paid for in it stop selling for full price
        if (value && !this._isWaveInProgress) {
            this.game.buildPhase++;
        }
        this._isWaveInProgress = value;
    }

    public VerifyCreepMovement(): void {
        const spawnedCreeps: SpawnedCreeps | undefined = this.game.worldMap.spawnedCreeps;
        if (spawnedCreeps !== undefined) {
            spawnedCreeps.unitMap.forEach((u: Creep) => {
                if (u.GetCurrentOrder() === 0 && u.targetCheckpoint) {
                    u.ReapplyMovement();
                }
            });

        }
    }


    public SpawnCreeps(): void {
        const wave: WaveCreep = this.game.worldMap.waveCreeps[this._currentWave - 1];
        SyncTrace.note('wave', `${this._currentWave} type=${wave.GetTypeID()}`);
        this.game.playerSync.sendGlobal('wave', `${this._currentWave}`);
        SendMessage(`Level ${this._currentWave} - ${wave.GetName()}`);
        // Wave N is spawning, so wave N-1 has completed: fire the bot's optional rate-at-wave trigger.
        this.game.checkRateAtWave(this._currentWave - 1);
        // Adaptive difficulty (when on): apply the exponential rise step on a step wave BEFORE this
        // wave's creeps spawn (so they use the risen difficulty), then capture the per-wave snapshot.
        const engine = this.game.adaptiveDifficulty;
        if (engine) {
            if (engine.isRiseStepWave(this._currentWave)) {
                engine.applyRiseStep();
            }
            this.broadcastAdaptiveSnapshot(wave);
            if (this.game.debugMode) {
                SendMessage(`|cFF888888[adaptive] wave ${this._currentWave}: ${engine.globalDifficulty()}% global, step ${engine.currentStep()}, ${engine.abilityLevelForWave()} abilities|r`);
            }
        }

        let spawnAmount: number = 10;
        switch (wave.getCreepType()) {
            case CREEP_TYPE.CHAMPION:
                spawnAmount = 4;
                break;
            case CREEP_TYPE.BOSS:
                spawnAmount = 1;
                break;

        }
        if (wave.GetWaveNumber() > 35) {
            spawnAmount = 1;
        }
        if (this._currentWave === 35) {
            SetTimeOfDay(0.00);
            SetWaterBaseColorBJ(100, 33.00, 33.00, 0);
        }
        this.startSpawning(spawnAmount, wave);
    }

    private startSpawning(amount: number, wave: WaveCreep): void {
        let creepOwner: number = 0;
        if (!this.game.worldMap.spawnedCreeps) {
            return;
        }

        const spawned: Map<number, Creep> = this.game.worldMap.spawnedCreeps.unitMap;
        const abilities: CreepAbility[] = this.game.creepAbilityHandler.GetAbilitiesForWave(wave);
        for (let y: number = 0; y < amount; y += 1) {
            for (let i: number = 0; i < this.game.worldMap.playerSpawns.length; i += 1) {
                const spawn: PlayerSpawns = this.game.worldMap.playerSpawns[i];
                spawn.SpawnCreep(this, spawned, abilities, wave, creepOwner);
            }
            creepOwner += 1;
            TriggerSleepAction(0.50);
            if (this.retired) {
                return;
            }
        }
        this.FinishedSpawning();
    }


    /**
     * Captures the adaptive state for a host bot each wave (only in adaptive games): the global
     * difficulty, the rise step, each player's effective difficulty and leak-ease, and each player's
     * economy (gold/lumber/towers/value/kills - captured for analysis, never a live input, since the
     * economy is transferable). Broadcast-only (no handler), each line well under 200 chars.
     */
    private broadcastAdaptiveSnapshot(wave: WaveCreep): void {
        const engine = this.game.adaptiveDifficulty;
        if (!engine) {
            return;
        }
        const sync = this.game.playerSync;
        const w: number = this._currentWave;
        const type: CREEP_TYPE = wave.getCreepType();
        const typeTag: string = type === CREEP_TYPE.AIR ? 'air'
            : type === CREEP_TYPE.BOSS ? 'boss' : type === CREEP_TYPE.CHAMPION ? 'champ' : 'norm';
        // Headline trajectory (the game record's difficulty_path keys on this one).
        sync.sendGlobal('difficulty', `${w}:${engine.globalDifficulty()}:${engine.abilityLevelForWave()}`);
        sync.sendGlobal('adapt-global',
            `${w}:${engine.globalDifficulty()}:${engine.currentStep()}:${engine.abilityLevelForWave()}:${typeTag}:${this.game.gameLives}`);
        let trace: string = `wave=${w} global=${engine.globalDifficulty()} step=${engine.currentStep()}`;
        for (const player of this.game.players.values()) {
            sync.sendGlobal('adapt-lane',
                `${w}:${player.id}:${engine.hpDifficultyForLane(player.lane)}:${engine.leakEaseForLane(player.lane)}:${Math.round(engine.overkillSumForLane(player.lane))}:${engine.overkillCountForLane(player.lane)}:${Math.round(engine.hpPoolForLane(player.lane))}:${engine.deepestReachedForLane(player.lane)}`);
            let towerValue: number = 0;
            const towerCounts: Map<number, number> = new Map<number, number>();
            for (const tower of player.towersArray) {
                towerValue += tower.towerValue;
                const typeId: number = tower.GetTypeID();
                towerCounts.set(typeId, (towerCounts.get(typeId) ?? 0) + 1);
            }
            const lumber: number = GetPlayerState(player.handle, PLAYER_STATE_RESOURCE_LUMBER);
            sync.sendGlobal('adapt-econ',
                `${w}:${player.id}:${player.getGold()}:${lumber}:${player.towersArray.length}:${towerValue}:${player.kills}`);
            // Tower mix: each tower type and its count, so v2 can study composition (rawcode*count,…).
            let mix: string = '';
            for (const [typeId, count] of towerCounts) {
                mix += (mix === '' ? '' : ',') + DecodeFourCC(typeId) + '*' + count;
            }
            sync.sendGlobal('adapt-towers', `${w}:${player.id}:${mix}`);
            trace += ` l${player.lane}=${engine.hpDifficultyForLane(player.lane)}`;
        }
        // Every client computes identical difficulties; the harness diffs this to catch any divergence.
        SyncTrace.note('adaptive', trace);
        if (this.game.scoreBoard) {
            MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 3, `Adaptive ${engine.globalDifficulty()}%`);
        }
        // The capture tallies (overkill, HP pool) covered the window up to this snapshot; reset them.
        engine.resetWindow();
    }

    public abstract GameTimeUpdateEvent(): void;

    public abstract FinishedSpawning(): void;

}
