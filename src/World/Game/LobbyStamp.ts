/**
 * Leaves the local wall-clock time on disk while the map sits in the lobby, and reads it back
 * in the game, so each client knows how long it waited in the lobby - the host waited longest.
 *
 * The lobby executes the whole script chunk (root code included) in its own Lua state with
 * working Preload natives; the game runs the chunk again in a fresh state. A global cannot
 * cross that gap, a file in CustomMapData can. The stamp is written from the chunk root, so
 * it runs in the lobby pass; the game pass's root write was seen not to touch the file.
 *
 * Reading uses the Preloader trick: Preloader() executes a preload file, and a line smuggled
 * into it calls BlzSetAbilityTooltip with the stamp, which BlzGetAbilityTooltip then returns.
 * Both are local to the client, which is what is wanted here.
 */
const STAMP_FILE = 'wm-lobby.txt';
const CARRIER_ABILITY = 'ANcl';
const PREFIX = 'LOBBY:';

export function writeLobbyStamp(): void {
    pcall(() => {
        PreloadGenClear();
        PreloadGenStart();
        // Closes Preload's string, adds our call, comments out the rest of the generated line
        Preload(`")\ncall BlzSetAbilityTooltip('${CARRIER_ABILITY}', "${PREFIX}${os.time()}", 0)\n//`);
        PreloadGenEnd(STAMP_FILE);
    });
}

/** The lobby stamp of this client, or undefined when no readable stamp exists. */
export function readLobbyStamp(): number | undefined {
    const [ok, value] = pcall(() => {
        Preloader(STAMP_FILE);
        return BlzGetAbilityTooltip(FourCC(CARRIER_ABILITY), 0) ?? '';
    });
    if (!ok || typeof value !== 'string' || value.indexOf(PREFIX) !== 0) {
        return undefined;
    }
    const stamp = Number(value.substring(PREFIX.length));
    return isNaN(stamp) ? undefined : stamp;
}
