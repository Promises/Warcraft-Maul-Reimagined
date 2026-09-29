import {Timer} from 'w3ts';
import {WarcraftMaul} from '../WarcraftMaul';
import {Defender} from '../Entity/Players/Defender';
import {Log} from '../../lib/Serilog/Serilog';
import {SyncTrace} from '../../lib/SyncTrace';
import {BitReader, BitWriter} from '../../lib/Save/Bits';
import {decodeSave, encodeSave, saveFileName, Sections} from '../../lib/Save/SaveCodec';

/** A part of the game that keeps its data in a save: one section of it. */
export interface SavePart {
    /** The section's id; never reused for another part. */
    readonly section: number;

    /** The player's data, from their save; undefined when the save has none (or no save). */
    load(player: Defender, reader: BitReader | undefined): void;

    save(player: Defender, writer: BitWriter): void;
}

// Read a moment into the game: sync messages cannot be sent while the map initialises
const READ_DELAY = 1;
// A player whose save has not arrived by then (one who left, say) plays with an empty one
const LOAD_TIMEOUT = 10;
const WRITE_INTERVAL = 1;
// Letters per preload line and per sync message, under both of their limits
const PART_LENGTH = 200;
// Standard abilities whose level 1 tooltip carries one line of the file while it is read; their
// own tooltips are put back after
const CARRIERS = ['Amls', 'Aroc', 'Amic', 'Amil', 'Aclf', 'Acmg', 'Adef', 'Adis'];
// Starts every line of a save file. A tooltip cannot be set to '' (the ability's own text stays),
// so a carrier the file did not set is told apart by not starting with it
const LINE_MARK = 'WM:';
// What each carrier is set to before the file runs: anything not starting with LINE_MARK
const UNSET = '-';

/**
 * Each player's save: a file on their own machine, read at the start of the game, sent to every
 * client and handed to the parts, and rewritten whenever a part's data changes. See the "Warcraft
 * Maul Save Format" design doc.
 *
 * The file is read and written only by its owner's client; everything the game acts on arrives
 * through PlayerSync, so every client applies the same saves in the same order.
 */
export class Saves {
    private readonly parts: SavePart[] = [];
    // Sections this map version does not know (a newer version's), written back unchanged
    private readonly kept: Map<number, Sections> = new Map<number, Sections>();
    private readonly incoming: Map<number, string[]> = new Map<number, string[]>();
    private readonly loaded: Set<number> = new Set<number>();
    // Local: whether the local player's file needs writing
    private dirty: boolean = false;

    constructor(private readonly game: WarcraftMaul) {
        game.playerSync.on('save', (player, data) => this.receive(player, data));
        Timer.create().start(READ_DELAY, false, () => Saves.logged('reading', () => this.readAndSend()));
        Timer.create().start(READ_DELAY + LOAD_TIMEOUT, false, () => Saves.logged('loading', () => this.giveUpWaiting()));
        Timer.create().start(WRITE_INTERVAL, true, () => Saves.logged('writing', () => this.writeIfDirty()));
    }

    /** Runs a timer's work; a Lua error in a timer callback is otherwise lost without a trace. */
    private static logged(what: string, work: () => void): void {
        try {
            work();
        } catch (error) {
            Log.Error(`save: ${what} failed: ${error}`);
        }
    }

    public register(part: SavePart): void {
        this.parts.push(part);
    }

    /** Whether the player's save has been applied; until then their parts hold nothing. */
    public isLoaded(player: Defender): boolean {
        return this.loaded.has(player.id);
    }

    /** Called by a part when the player's data changed: their own client writes the file. */
    public changed(player: Defender): void {
        if (player.handle === GetLocalPlayer()) {
            this.dirty = true;
        }
    }

    // Local: this client reads its own player's file and sends it to everyone
    private readAndSend(): void {
        const local = this.game.players.get(GetPlayerId(GetLocalPlayer()));
        if (!local) {
            return;
        }
        const text = Saves.read(saveFileName(local.getBattleTag()));
        const parts: string[] = [];
        for (let at = 0; at < text.length; at += PART_LENGTH) {
            parts.push(text.substring(at, at + PART_LENGTH));
        }
        if (parts.length === 0) {
            this.game.playerSync.send('save', '0/0:');
            return;
        }
        parts.forEach((part, i) => this.game.playerSync.send('save', `${i + 1}/${parts.length}:${part}`));
    }

    /** One part of a player's save, "<index>/<count>:<letters>"; "0/0:" for no save. */
    private receive(player: Defender, data: string): void {
        if (this.loaded.has(player.id)) {
            return;
        }
        const colon = data.indexOf(':');
        const slash = data.indexOf('/');
        const index = Number(data.substring(0, slash));
        const count = Number(data.substring(slash + 1, colon));
        if (colon === -1 || slash === -1 || isNaN(index) || isNaN(count) || index > count) {
            Log.Warning(`save: a malformed part from ${player.getPlayerName()}`);
            return;
        }
        if (count === 0) {
            this.apply(player, '');
            return;
        }
        const parts = this.incoming.get(player.id) ?? [];
        parts[index - 1] = data.substring(colon + 1);
        this.incoming.set(player.id, parts);
        let complete = true;
        for (let i = 0; i < count; i++) {
            complete = complete && parts[i] !== undefined;
        }
        if (complete) {
            this.incoming.delete(player.id);
            this.apply(player, parts.join(''));
        }
    }

    private giveUpWaiting(): void {
        for (const player of this.game.players.values()) {
            if (!this.loaded.has(player.id)) {
                SyncTrace.note('save', `p${player.id} timed out`);
                this.incoming.delete(player.id);
                this.apply(player, '');
            }
        }
    }

    /** Runs on every client with the same text: decodes it and hands each part its section. */
    private apply(player: Defender, text: string): void {
        this.loaded.add(player.id);
        let sections: Sections = new Map();
        if (text !== '') {
            const decoded = decodeSave(text, player.getBattleTag());
            if (decoded.sections) {
                sections = decoded.sections;
            } else {
                Log.Warning(`save: ${player.getPlayerName()}'s save could not be read (${decoded.problem}); starting empty`);
                SyncTrace.note('save', `p${player.id} rejected ${decoded.problem}`);
            }
        }
        const known = new Set<number>();
        for (const part of this.parts) {
            known.add(part.section);
            const section = sections.get(part.section);
            part.load(player, section ? new BitReader(section.bytes, section.bitLength) : undefined);
        }
        const kept: Sections = new Map();
        sections.forEach((section, id) => {
            if (!known.has(id)) {
                kept.set(id, section);
            }
        });
        this.kept.set(player.id, kept);
        SyncTrace.note('save', `p${player.id} loaded letters=${text.length} sections=${sections.size} kept=${kept.size}`);
    }

    // Local
    private writeIfDirty(): void {
        const local = this.game.players.get(GetPlayerId(GetLocalPlayer()));
        // Never before the player's save has loaded, or an empty book would replace it
        if (!this.dirty || !local || !this.loaded.has(local.id)) {
            return;
        }
        this.dirty = false;
        const sections: Sections = new Map();
        (this.kept.get(local.id) ?? new Map()).forEach((section, id) => sections.set(id, section));
        for (const part of this.parts) {
            const writer = new BitWriter();
            part.save(local, writer);
            sections.set(part.section, {bytes: writer.toBytes(), bitLength: writer.bitLength});
        }
        Saves.write(saveFileName(local.getBattleTag()), encodeSave(sections, local.getBattleTag()));
    }

    /**
     * A save file's letters, '' when there is none. Preloader runs the file, whose lines set the
     * carriers' tooltips to LINE_MARK and their letters; it must sit in a preload pass of its own
     * to work once the game is on. The carriers' own tooltips are put back after.
     */
    private static read(file: string): string {
        const ids = CARRIERS.map(id => FourCC(id));
        const own = ids.map(id => BlzGetAbilityTooltip(id, 0) ?? '');
        ids.forEach(id => BlzSetAbilityTooltip(id, UNSET, 0));
        const [ok] = pcall(() => {
            PreloadStart();
            Preloader(file);
            PreloadEnd(1);
        });
        const lines: string[] = [];
        for (const id of ids) {
            const line = BlzGetAbilityTooltip(id, 0) ?? '';
            if (line.indexOf(LINE_MARK) !== 0) {
                break;
            }
            lines.push(line.substring(LINE_MARK.length));
        }
        ids.forEach((id, i) => BlzSetAbilityTooltip(id, own[i], 0));
        return ok ? lines.join('') : '';
    }

    private static write(file: string, text: string): void {
        const lines: string[] = [];
        for (let at = 0; at < text.length; at += PART_LENGTH) {
            lines.push(text.substring(at, at + PART_LENGTH));
        }
        if (lines.length > CARRIERS.length) {
            Log.Error(`save: ${text.length} letters is more than a save file holds; not written`);
            return;
        }
        PreloadGenClear();
        PreloadGenStart();
        lines.forEach((line, i) => {
            // Closes Preload's string, adds the call, comments out the rest of the generated line
            Preload(`")\ncall BlzSetAbilityTooltip('${CARRIERS[i]}', "${LINE_MARK}${line}", 0)\n//`);
        });
        PreloadGenEnd(file);
    }
}
