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

export abstract class AbstractGameRound {


    public readonly game: WarcraftMaul;
    private _isWaveInProgress: boolean = false;
    private _currentWave: number = 1;
    public antiJuggleEnabled: boolean = true;
    private creepMovementTimeout: Trigger;

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
        SendMessage(`Level ${this._currentWave} - ${wave.GetName()}`);

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
        }
        this.FinishedSpawning();
    }


    public abstract GameTimeUpdateEvent(): void;

    public abstract FinishedSpawning(): void;

}
