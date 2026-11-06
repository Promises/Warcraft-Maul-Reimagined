import { WarcraftMaul } from '../../WarcraftMaul';
import { WaveCreep } from '../../Entity/WaveCreep';
import { Creep } from '../../Entity/Creep';
import { PlayerSpawns } from '../../Entity/PlayerSpawns';
import { CreepAbility } from '../../Entity/CreepAbilities/specs/CreepAbility';
import { SpawnedCreeps } from '../../Entity/SpawnedCreeps';
import {Trigger} from "w3ts";
import {CREEP_TYPE, SendMessage, Util} from "../../../lib/translators";
import * as settings from '../../GlobalSettings';
import {SyncTrace} from '../../../lib/SyncTrace';
import {Fold} from '../AdaptiveDifficultyEngine';

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
        // Debug: with the adaptive difficulty on, show the team's current global % and ability level
        // going into the wave, so the adjustment can be watched. Flat difficulties are constant.
        if (this.game.debugMode && this.game.adaptiveDifficulty) {
            const engine = this.game.adaptiveDifficulty;
            SendMessage(`|cFF888888[adaptive] wave ${this._currentWave}: ${engine.globalDifficulty()}% global, ${engine.abilityLevelForWave()} abilities|r`);
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
     * Folds the wave that just ended into the adaptive difficulty (when it is on): scores each lane's
     * leaks this wave and updates the scoreboard's difficulty to the new team global. Called from each
     * mode's round-end before the wave number advances, so the wave just run is the one scored. A
     * no-op for flat difficulties.
     */
    protected foldAdaptiveWave(): void {
        const engine = this.game.adaptiveDifficulty;
        if (!engine) {
            return;
        }
        const wave: WaveCreep = this.game.worldMap.waveCreeps[this._currentWave - 1];
        const type: CREEP_TYPE = wave.getCreepType();
        const hardWave: boolean =
            type === CREEP_TYPE.AIR || type === CREEP_TYPE.BOSS || type === CREEP_TYPE.CHAMPION;
        const endedWave: number = this._currentWave;
        const lanes: number[] = [];
        for (const player of this.game.players.values()) {
            lanes.push(player.lane);
        }
        const fold: Fold = engine.endWave(lanes, hardWave);

        // Trace the resulting state on every client, so the desync harness can diff the whole
        // feedback loop directly - any divergence shows up here, at the wave it happened.
        let trace: string = `wave=${endedWave} hard=${hardWave} global=${fold.global} ability=${fold.abilityLevel}`;
        for (const laneFold of fold.lanes) {
            trace += ` l${laneFold.lane}=${laneFold.difficulty}`;
        }
        SyncTrace.note('adaptive', trace);

        this.broadcastAdaptiveTelemetry(endedWave, type, fold);

        if (this.game.scoreBoard) {
            MultiboardSetItemValueBJ(this.game.scoreBoard.board, 2, 3, `Adaptive ${fold.global}%`);
        }
    }

    /**
     * Telemetry for a host bot, so adaptive can be tuned from real games: the headline trajectory the
     * record keys on, then per fold the full global state, each lane's fold (leaks, the reason, the
     * points and the resulting difficulty) and each player's economy - to tell "difficulty too high"
     * apart from "built badly". All broadcast-only (no handler), only in adaptive games; each line
     * stays well under 200 chars. deepestFraction is a constant 500 (per mille) until the v2 signal.
     */
    private broadcastAdaptiveTelemetry(endedWave: number, type: CREEP_TYPE, fold: Fold): void {
        const sync = this.game.playerSync;
        // Headline trajectory (the game record's difficulty_path keys on this one).
        sync.sendGlobal('difficulty', `${endedWave}:${fold.global}:${fold.abilityLevel}`);
        const typeTag: string = type === CREEP_TYPE.AIR ? 'air'
            : type === CREEP_TYPE.BOSS ? 'boss' : type === CREEP_TYPE.CHAMPION ? 'champ' : 'norm';
        sync.sendGlobal('adapt-global',
            `${endedWave}:${fold.global}:${fold.abilityLevel}:${fold.globalCarry}:${typeTag}:${fold.teamLeaks}:${this.game.gameLives}`);
        for (const player of this.game.players.values()) {
            const laneFold = fold.lanes.find(entry => entry.lane === player.lane);
            if (laneFold) {
                sync.sendGlobal('adapt-lane',
                    `${endedWave}:${player.id}:${laneFold.leaks}:${Math.round(laneFold.deepestFraction * 1000)}:${laneFold.reason}:${laneFold.score}:${laneFold.offset}:${laneFold.offsetCarry}:${laneFold.difficulty}`);
            }
            let towerValue: number = 0;
            for (const tower of player.towersArray) {
                towerValue += tower.towerValue;
            }
            const lumber: number = GetPlayerState(player.handle, PLAYER_STATE_RESOURCE_LUMBER);
            sync.sendGlobal('adapt-econ',
                `${endedWave}:${player.id}:${player.getGold()}:${lumber}:${player.towersArray.length}:${towerValue}`);
        }
    }

    public abstract GameTimeUpdateEvent(): void;

    public abstract FinishedSpawning(): void;

}
