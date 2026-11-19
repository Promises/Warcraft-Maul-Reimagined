import {WarcraftMaul} from '../WarcraftMaul';
import {Defender, HYBRID_BUILD_ABILITY} from '../Entity/Players/Defender';
import {Race} from './Races/Race';
import {
    DummyTowers,
    HybridTierEight,
    HybridTierFive,
    HybridTierFour,
    HybridTierNine,
    HybridTierOne,
    HybridTierSeven,
    HybridTierSix,
    HybridTierThree,
    HybridTierTwo,
} from './Races/HybridRandom';
import {Unit} from "w3ts";
import {SendMessage, Util} from "../../lib/translators";
import {GameTowerDef} from "./Races/HybridRandom.types";
import {SyncTrace} from '../../lib/SyncTrace';
import {BLITZ_RANDOM_BLACKLIST, GAME_MODES} from '../GlobalSettings';
import {DraftView} from './Ui/HybridDraft/DraftPanel';

/** The nine hybrid tier pools in order, for iterating the draft. */
const HYBRID_TIERS: GameTowerDef[][] = [
    HybridTierOne, HybridTierTwo, HybridTierThree, HybridTierFour, HybridTierFive,
    HybridTierSix, HybridTierSeven, HybridTierEight, HybridTierNine,
];
const HYBRID_OPTIONS_PER_TIER = 2;

/** One player's in-progress draft: the rolled options per tier and which is chosen in each. */
interface HybridDraftState {
    options: GameTowerDef[][];
    choice: number[];
}

export class RacePicking {
    private game: WarcraftMaul;
    public HybridPool: Map<string, GameTowerDef> = new Map<string, GameTowerDef>();
    // Per player, populated identically on every client by the synced roll (see rollHybridDraft).
    private readonly drafts: Map<number, HybridDraftState> = new Map<number, HybridDraftState>();

    constructor(game: WarcraftMaul) {
        this.game = game;
        this.CreateHybridPool();
    }

    public PickRaceForPlayerByItem(player: Defender, raceItem: number): void {
        SyncTrace.note('pick', `p${player.id} item=${raceItem}`);
        if (raceItem === FourCC('I00W')) { // Hardcore random
            if (player.hasHybridRandomed) {
                player.giveLumber(1);
                player.sendMessage('You can only use Hybrid Random!');
            } else {
                if (!player.hasHardcoreRandomed) {
                    if (player.repickCounter === 0) {
                        player.hasHardcoreRandomed = true;
                        this.HardCoreRandomRace(player);
                        player.giveGold(50);
                    } else {
                        player.giveLumber(1);
                        player.sendMessage('You can\'t hardcore random after using normal random!');
                    }
                } else {
                    player.giveLumber(1);
                }
            }
        } else if (raceItem === FourCC('I00V')) { // Normal Random
            if (player.hasHybridRandomed) {
                player.giveLumber(1);
                player.sendMessage('You can only use Hybrid Random!');
            } else {
                if (player.repickCounter < 3) {
                    player.repickCounter++;
                }
                player.giveGold(40 - 10 * player.repickCounter);
                this.NormalRandomRace(player);
            }
        } else if (raceItem === FourCC('I00X')) { // Hybrid Random
            // Only as the player's race: not on top of a chosen or random one, but after a repick
            // (which leaves none), whatever was picked before it. Re-buying it re-rolls the draft
            // (costs a lumber); the 50-gold bonus is paid only on the first hybrid.
            if (!player.hasPrimaryRace() && !player.hasHardcoreRandomed) {
                if (this.HybridRandomRace(player)) {
                    player.giveGold(50);
                }
            } else {
                player.giveLumber(1);
                player.sendMessage('You can\'t hybrid random after using normal / hardcore random / selection!');
            }
        } else {
            if (player.hasHybridRandomed) {
                player.giveLumber(1);
                player.sendMessage('You can only use Hybrid Random!');
            } else {
                player.hasNormalPicked = true;
                this.GetSelectedRace(player, raceItem);
            }
        }
    }

    private HardCoreRandomRace(player: Defender) {
        const randomedRace = this.RandomRace(player);
        if (randomedRace) {
            SendMessage(player.getNameWithColour() + ' has |cFF375FF1ra|r|cFF364CF0nd|r|cFF3535EFom|r|cFF4A34EFed|r ' + randomedRace.name);
        }
    }

    private GiveBuyingPlayerBuilder(player: Defender, randomedRace: Race) {
        randomedRace.pickAction(player);
    }

    private GetSelectedRace(player: Defender, soldItem: number) {
        const race = this.getRaceFromItem(soldItem);
        if (race) {
            player.races.push(race);
            this.game.playerSync.sendGlobal('race', `${player.id}:${race.itemid}`);
            race.pickAction(player);
            SendMessage(player.getNameWithColour() + ' has chosen ' + race.name);
        }

    }


    private getRaceFromItem(soldItem: number) {
        for (const race of this.game.worldMap.races) {
            if (FourCC(race.itemid) == soldItem) {
                return race;
            }
        }
        return null;
    }

    private NormalRandomRace(player: Defender) {
        const randomedRace = this.RandomRace(player);
        if (randomedRace) {
            SendMessage(player.getNameWithColour() + ' has |cFF375FF1ra|r|cFF364CF0nd|r|cFF3535EFom|r|cFF4A34EFed|r ' + randomedRace.name);
        }

    }

    private RandomRace(player: Defender): Race | undefined {
        // Pick from the races actually available: enabled, not already held, and - in Blitz - not on
        // the Blitz random blacklist. Building the pool up front (rather than re-rolling) means the
        // blacklist can never loop, and an exhausted pool gives lumber instead.
        const blitz: boolean = this.game.diffVote.mode === GAME_MODES.BLITZ;
        const pickable: Race[] = this.game.worldMap.races.filter(race =>
            race.enabled
            && !player.hasRace(race)
            && !(blitz && BLITZ_RANDOM_BLACKLIST.indexOf(race.itemid) >= 0));
        if (pickable.length === 0) {
            player.giveLumber(1);
            return;
        }
        const randomedRace: Race = pickable[Util.RandomInt(0, pickable.length - 1)];
        player.races.push(randomedRace);
        SyncTrace.note('rolled', `p${player.id} race=${randomedRace.name}`);
        this.game.playerSync.sendGlobal('race', `${player.id}:${randomedRace.itemid}`);
        this.GiveBuyingPlayerBuilder(player, randomedRace);
        return randomedRace;
    }

    /**
     * Starts (or re-rolls) a hybrid draft: rolls the options and opens the draft panel. The player picks
     * one tower per tier there and confirms (finalizeHybrid). Re-buying Hybrid Random re-rolls the draft
     * with fresh options - that costs a lumber (the item), but only the FIRST hybrid returns true, so the
     * caller pays the 50-gold bonus once and rerolling is not a gold tap.
     */
    private HybridRandomRace(player: Defender): boolean {
        const firstHybrid = !player.hasHybridRandomed && !this.drafts.has(player.id);

        // Roll the options with the synced native generator so every client gets the same draft -
        // a set that differs is a desync the moment one of those towers is built. Towers already
        // rolled are avoided so no tower shows up twice across the whole draft; the filter is
        // deterministic, so this stays in step.
        const options = this.rollDraftOptions((pool, taken) => this.rollDistinct(pool, taken));
        const state: HybridDraftState = {options, choice: options.map(() => 0)};
        this.drafts.set(player.id, state);
        SyncTrace.note('hybrid-draft',
            `p${player.id} ${options.map(tier => tier.map(tower => tower.id).join('/')).join(',')}`);

        // The draft defers hasHybridRandomed to confirm, so the race picker's own close test (which
        // keys on that) no longer fires - close it here as the draft takes over the screen.
        this.game.raceSelectPanel.close(player);
        this.game.draftPanel.show(player, this.buildDraftView(state));
        return firstHybrid;
    }

    /** Picks option `option` for tier `row` of the acting player's draft; runs on every client (synced click). */
    public onDraftSelect(player: Defender, row: number, option: number): void {
        const state = this.drafts.get(player.id);
        if (state === undefined || row < 0 || row >= state.choice.length
            || option < 0 || option >= state.options[row].length) {
            return;
        }
        state.choice[row] = option;
        // Only the local owner's view re-renders; show() is gated to the local player.
        this.game.draftPanel.show(player, this.buildDraftView(state));
    }

    /** Confirms the acting player's draft and builds it; runs on every client (synced click). */
    public onDraftConfirm(player: Defender): void {
        const state = this.drafts.get(player.id);
        if (state === undefined) {
            return;
        }
        player.hybridTowers = state.choice.map((chosen, tier) => state.options[tier][chosen]);
        this.drafts.delete(player.id);
        this.game.draftPanel.hide(player);
        this.finalizeHybrid(player);
    }

    /** Cancels any in-progress draft and hides the panel, for a repick or game reset. */
    public cancelDraft(player: Defender): void {
        this.drafts.delete(player.id);
        this.game.draftPanel.hide(player);
    }

    /** The draft's chosen towers as the local player's view. */
    private buildDraftView(state: HybridDraftState): DraftView {
        return {
            title: '|cffB0F442Hybrid Draft|r  -  pick one tower per tier',
            previewHeader: '|cfffcd312Your build|r',
            optionsHeader: '|cfffcd312Choose one per tier|r',
            confirm: 'Confirm build',
            rows: state.options.map((tierOptions, tier) => ({
                label: `|cffffcc00${tier + 1}|r`,
                chosen: state.choice[tier],
                options: tierOptions.map(tower => ({
                    icon: tower.icon ?? '',
                    title: tower.name,
                    body: tower.toolTipExtended,
                    goldCost: tower.goldCost,
                })),
            })),
        };
    }

    /**
     * Commits the chosen hybrid build: creates the builder, allows its towers, and reports the build.
     * Runs on every client (onDraftConfirm is a synced click), so the handles it makes stay in step.
     */
    private finalizeHybrid(player: Defender): void {
        if (!player.hasHybridRandomed) {
            player.hybridBuilder = Unit.create(player, FourCC('e00I'), player.getCenterX(), player.getCenterY(), 0);
            // The native build menu would show the placeholder towers; building goes through
            // the panel instead. The ability stays for the build orders the panel issues.
            if (player.hybridBuilder) {
                BlzUnitHideAbility(player.hybridBuilder.handle, HYBRID_BUILD_ABILITY, true);
            }
        }

        player.hasHybridRandomed = true;
        // The build every client has to agree on: a hybrid set that differs is a desync the
        // moment one of those towers is built.
        SyncTrace.note('hybrid', `p${player.id} ${player.hybridTowers.map(tower => tower.name).join(',')}`);
        // Hybrid random has no single race: report the hybrid item plus the 9 chosen tower ids, so a
        // host bot can resolve this player's build:<tier> placements to the actual towers.
        this.game.playerSync.sendGlobal('race', `${player.id}:I00X:${player.hybridTowers.map(tower => tower.id).join(',')}`);

        for (let playerNum = 0; playerNum < 13; playerNum++) {
            for (let tier = 0; tier < 9; tier++) {
                player.setTechMaxAllowed(FourCC(DummyTowers[`${playerNum + 1}`][`${tier + 1}`]), playerNum === player.id ? -1 : 0)
            }
        }

        this.game.hybridBuildPanel.refresh(player);
        this.game.actionBar.showHybridBuild(player);
        SendMessage(player.getNameWithColour() + ' has |cFFB0F442hy|r|cFF8CF442b|r|cFF42F4C5r|r|cFF42F4F1id|r randomed!');
    }

    /** Picks one from a pool, avoiding those already taken when possible; synced and never loops. */
    /**
     * Rolls the nine tiers' options with `pick`, pushing each result onto `taken` so no tower repeats
     * across the draft. Shared by the live roll (synced RNG) and the debug fixed roll (deterministic).
     */
    private rollDraftOptions(pick: (pool: GameTowerDef[], taken: GameTowerDef[]) => GameTowerDef): GameTowerDef[][] {
        const taken: GameTowerDef[] = [];
        const options: GameTowerDef[][] = [];
        for (const pool of HYBRID_TIERS) {
            const tierOptions: GameTowerDef[] = [];
            for (let o = 0; o < HYBRID_OPTIONS_PER_TIER; o++) {
                const rolled = pick(pool, taken);
                taken.push(rolled);
                tierOptions.push(rolled);
            }
            options.push(tierOptions);
        }
        return options;
    }

    /**
     * Debug only: opens a hybrid draft with a deterministic, reproducible set - the first distinct tower
     * for each slot, no RNG - so UI-fidelity captures of the draft panel and the build menu it leads to
     * match across runs and machines (real client vs wc3-sim). Drive it on with -draftpick/-draftok.
     */
    public startFixedDraft(player: Defender): void {
        const options = this.rollDraftOptions((pool, taken) =>
            pool.filter(tower => taken.indexOf(tower) < 0)[0] ?? pool[0]);
        const state: HybridDraftState = {options, choice: options.map(() => 0)};
        this.drafts.set(player.id, state);
        // Emit the same readiness trace as the live roll, so a harness can key on the event instead
        // of sleeping; render-neutral, debug-only.
        SyncTrace.note('hybrid-draft',
            `p${player.id} ${options.map(tier => tier.map(tower => tower.id).join('/')).join(',')}`);
        this.game.raceSelectPanel.close(player);
        this.game.draftPanel.show(player, this.buildDraftView(state));
    }

    private rollDistinct(pool: GameTowerDef[], taken: GameTowerDef[]): GameTowerDef {
        const available = pool.filter(tower => taken.indexOf(tower) < 0);
        const source = available.length > 0 ? available : pool;
        return source[GetRandomInt(0, source.length - 1)];
    }

    private CreateHybridPool(): void {
        HybridTierEight.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierFive.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierFour.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierNine.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierOne.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierSeven.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierSix.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierThree.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
        HybridTierTwo.forEach((d: GameTowerDef) => this.HybridPool.set(d.id, d));
    }
}
