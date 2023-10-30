import {CheckPoint} from './CheckPoint';
import {Log} from '../../lib/Serilog/Serilog';
import {AbstractGameRound} from '../Game/BaseMaul/AbstractGameRound';
import {CreepAbility} from './CreepAbilities/specs/CreepAbility';
import {WarcraftMaul} from '../WarcraftMaul';
import {Effect, Unit} from "w3ts";

export class Creep {
    public unit: Unit;
    public targetCheckpoint: CheckPoint | undefined;
    public gameRound: AbstractGameRound;
    public abilities: CreepAbility[];
    private readonly game: WarcraftMaul;

    constructor(creep: Unit, gameRound: AbstractGameRound, abilities: CreepAbility[], game: WarcraftMaul) {
        this.unit = creep;
        this.gameRound = gameRound;
        this.game = game;
        this.AddArmorBonusByDifficulty();
        this.AddHPBonusByDifficulty();
        this.abilities = abilities;

    }

    public ReapplyMovement(): void {
        if (!this.targetCheckpoint) {
            Log.Fatal('Creep is missing pathing data');
            return;
        }
        this.unit.issueOrderAt('move',
            GetRectCenterX(this.targetCheckpoint.rectangle),
            GetRectCenterY(this.targetCheckpoint.rectangle))
    }

    public printId(): void {
        // Log.Debug(this.getName());
    }

    public getName(): string {
        return this.unit.name;
    }

    public getTypeId(): number {
        return this.unit.typeId;
    }

    public getHandleId(): number {
        return this.unit.id;
    }


    public getLocation(): location {
        return GetUnitLoc(this.unit.handle);
    }

    public MorningPerson(): void {
        const mdlFile: string = 'Abilities\\Spells\\Human\\HolyBolt\\HolyBoltSpecialArt.mdl';
        const effect = Effect.create(mdlFile, this.unit.x, this.unit.y);
        effect?.destroy();
        SetUnitLifePercentBJ(GetEnteringUnit()!, GetUnitLifePercent(this.unit.handle) + 0.50 * this.gameRound.currentWave);
    }

    public AddCreepAbilities(): void {
        for (const ability of this.abilities) {
            ability.AddAbilityToCreep(this);
        }
    }

    public AddArmorBonusByDifficulty(): void {
        this.unit.armor = Math.round(this.unit.armor * (this.game.diffVote.difficulty / 100));
    }

    public AddHPBonusByDifficulty(): void {
        const unitHPScaling: number = Math.round(this.unit.maxLife * (this.game.diffVote.difficulty / 100));
        this.unit.maxLife = unitHPScaling;
        this.unit.life = unitHPScaling;
    }

    public SetPostition(x: number, y: number): void {
        this.unit.setPosition(x, y);
    }

    public SetFacingDirection(facing: number): void {
        this.unit.facing = facing;
    }

    public OrderMove(x: number, y: number): void {
        this.unit.issueOrderAt('move', x, y)
    }

    public GetCurrentOrder(): number {
        return this.unit.currentOrder;
    }
}
