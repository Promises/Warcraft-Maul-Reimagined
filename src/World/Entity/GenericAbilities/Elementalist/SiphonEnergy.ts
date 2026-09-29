/**
 *  Siphon Energy (Elementalist)
 *  Combines two runes to one tower, and two mature pieces to a Primal (for a fee). A Primal recipe
 *  the player has not discovered is revealed by the first cast, for free, and made by the next; a
 *  pair with no recipe says so. Discoveries go in the player's recipe book (RecipeBook).
 */
import { GenericAbility } from '../GenericAbility';
import { WarcraftMaul } from '../../../WarcraftMaul';
import { Defender } from '../../Players/Defender';
import { Tower } from '../../Tower/Specs/Tower';
import {Unit} from "w3ts";
import {DecodeFourCC, SendMessage} from "../../../../lib/translators";
import {displayName} from './RecipeBook';
import {SyncTrace} from "../../../../lib/SyncTrace";


export class SiphonEnergy extends GenericAbility implements AbilityOnEffectTargetsUnit, AbilityOnCastTargetsUnit {
    // Primals someone has made this game: the first of each is announced to everyone
    private readonly announced: Set<string> = new Set<string>();
    // Casters whose cast revealed a recipe: their cast was stopped, and must not fuse if it goes on
    private readonly revealing: Set<number> = new Set<number>();

    constructor(game: WarcraftMaul) {
        super('A0CT', game);
    }

    /**
     * Before a fusion takes effect: a pair with no recipe, a Primal the player has not discovered
     * (revealed now, made by the next cast), a limit reached or gold short each stop the cast with a word.
     */
    public TargetOnCastAction(): void {
        const caster = Unit.fromHandle(GetSpellAbilityUnit())!;
        const targetUnit = Unit.fromHandle(GetSpellTargetUnit())!;
        this.revealing.delete(caster.id);
        const towers = this.towers(caster, targetUnit);
        if (!towers) {
            return;
        }
        const pair = this.pair(caster, targetUnit);
        if (!pair) {
            this.miss(towers.owner, towers.source, towers.target);
            caster.issueImmediateOrder('stop');
            return;
        }
        const {owner, combination, fee} = pair;
        const book = this.game.recipeBook;
        const primal = this.game.abilityHandler.elementalistSettings.GetPrimalRecipe(combination);
        if (primal && !book.knows(owner, combination)) {
            book.discover(owner, combination);
            owner.sendMessage(`|cff87ceebA ${displayName(combination)} stirs:|r it ${primal.role}. `
                              + `Siphon again to make it for ${fee} gold.`);
            SyncTrace.note('siphon', `p${owner.id} revealed ${combination} fee=${fee}`);
            this.revealing.add(caster.id);
            caster.issueImmediateOrder('stop');
            return;
        }
        const limit = this.game.abilityHandler.elementalistSettings.GetLimit(combination);
        const have = owner.towersArray.filter(tower => DecodeFourCC(tower.GetTypeID()) === combination).length;
        let refusal: string | undefined;
        if (limit !== undefined && have >= limit) {
            refusal = `You may have ${limit} of these`;
        } else if (owner.getGold() < fee) {
            refusal = `This fusion costs ${fee} gold`;
        }
        if (refusal !== undefined) {
            owner.sendMessage(refusal);
            SyncTrace.note('siphon', `p${owner.id} refused ${combination} fee=${fee} gold=${owner.getGold()} have=${have}`);
            caster.issueImmediateOrder('stop');
        }
    }

    public TargetOnEffectAction(): void {
        if (this.revealing.delete(Unit.fromEvent()!.id)) {
            return;
        }
        const pair = this.pair(Unit.fromEvent()!, Unit.fromHandle(GetSpellTargetUnit())!);
        if (!pair) {
            return;
        }
        const {owner, source, target, combination, fee} = pair;
        const limit = this.game.abilityHandler.elementalistSettings.GetLimit(combination);
        const have = owner.towersArray.filter(tower => DecodeFourCC(tower.GetTypeID()) === combination).length;
        if (owner.getGold() < fee || (limit !== undefined && have >= limit)) {
            return;
        }
        owner.giveGold(-fee);
        // The fusion takes what both ingredients grew: the caster's through Upgrade, the target's here,
        // before the target turns to rock
        const targetCarried = target.carry();
        const fused = source.Upgrade(FourCC(combination));
        fused.receive(targetCarried);
        target.Upgrade(FourCC('n027'));
        SyncTrace.note('siphon', `p${owner.id} made ${combination} fee=${fee} damage=${fused.unit.getBaseDamage(0)}`);
        this.game.recipeBook.discover(owner, combination);
        if (fee > 0 && !this.announced.has(combination)) {
            this.announced.add(combination);
            SendMessage(`${owner.getNameWithColour()} has made the first ${displayName(combination)}!`);
        }
    }

    /**
     * No recipe: says so, and hints when either tower goes into a Primal the player has not
     * discovered.
     */
    private miss(owner: Defender, source: Tower, target: Tower): void {
        const book = this.game.recipeBook;
        const types = [DecodeFourCC(source.GetTypeID()), DecodeFourCC(target.GetTypeID())];
        const hinted = types.find(type => this.game.abilityHandler.elementalistSettings.GetPrimalRecipes()
            .some(recipe => (recipe.a === type || recipe.b === type) && !book.knows(owner, recipe.result)));
        owner.sendMessage(hinted === undefined
            ? 'Nothing stirs.'
            : `Nothing stirs, but the ${displayName(hinted)} hums: it goes into a Primal you have not discovered.`);
        SyncTrace.note('siphon', `p${owner.id} miss ${types.join('+')} hint=${hinted ?? 'none'}`);
    }

    /** The caster and target as the owner's towers. */
    private towers(caster: Unit, targetUnit: Unit): {owner: Defender, source: Tower, target: Tower} | undefined {
        const owner: Defender | undefined = this.game.players.get(caster.getOwner()!.id);
        if (!owner) {
            return undefined;
        }
        const source: Tower | undefined = owner.GetTower(caster.id);
        const target: Tower | undefined = owner.GetTower(targetUnit.id);
        if (!source || !target) {
            return undefined;
        }
        return {owner, source, target};
    }

    /** The two towers of a fusion that exists, and what it makes and costs. */
    private pair(caster: Unit, targetUnit: Unit): {owner: Defender, source: Tower, target: Tower, combination: string, fee: number} | undefined {
        const towers = this.towers(caster, targetUnit);
        if (!towers) {
            return undefined;
        }
        const {owner, source, target} = towers;
        const settings = this.game.abilityHandler.elementalistSettings;
        const sourceTypeID = DecodeFourCC(source.GetTypeID());
        const targetTypeID = DecodeFourCC(target.GetTypeID());
        if (!settings.HasCombination(sourceTypeID, targetTypeID)) {
            return undefined;
        }
        const combination = settings.GetCombination(sourceTypeID, targetTypeID);
        if (combination === '') {
            return undefined;
        }
        return {owner, source, target, combination, fee: settings.GetFee(sourceTypeID, targetTypeID)};
    }
}
