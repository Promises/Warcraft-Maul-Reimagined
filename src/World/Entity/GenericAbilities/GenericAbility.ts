import { WarcraftMaul } from '../../WarcraftMaul';

export class GenericAbility {

    private readonly abilityId: number;
    private _game: WarcraftMaul;
    constructor(abiID: string, game: WarcraftMaul){
        this.abilityId = FourCC(abiID);
        this._game = game;
    }

    get game(): WarcraftMaul {
        return this._game;
    }

    set game(value: WarcraftMaul) {
        this._game = value;
    }


    /**
     * The gold the game takes for casting this ability (a Reveal-based ability's own gold cost,
     * paid as the cast starts): what a tower it changes was paid.
     */
    protected goldCost(caster: unit): number {
        return BlzGetAbilityIntegerLevelField(BlzGetUnitAbility(caster, this.abilityId)!, ABILITY_ILF_GOLD_COST_NDT1, 0);
    }

    public Condition(): boolean{
        return GetSpellAbilityId() === this.abilityId;
    }

    public IsAttackActionAbility(): this is AttackActionAbility {
        return 'AttackAction' in this;
    }

    public IsAbilityOnEffectTargetsUnit(): this is AbilityOnEffectTargetsUnit {
        return 'TargetOnEffectAction' in this;
    }
    public IsAbilityOnCastTargetsUnit(): this is AbilityOnCastTargetsUnit {
        return 'TargetOnCastAction' in this;
    }
}
