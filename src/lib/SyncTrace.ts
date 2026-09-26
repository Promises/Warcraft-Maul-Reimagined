import {Unit} from 'w3ts';

/**
 * The lockstep trace: game events every client writes identically while they agree, so the
 * first line where two clients' traces differ is where they parted.
 *
 * The writing is done by wc3-slop-lan's map library (Slop), which its test harness injects into
 * a staged copy of the map; see SlopHooks. In any other game Slop is absent and a note costs
 * building its text and a nil check - keep notes out of per-frame code. Only note from code
 * every client runs alike - never under GetLocalPlayer.
 */
export class SyncTrace {
    public static note(category: string, text: string): void {
        if (Slop !== undefined) {
            Slop.note(category, text);
        }
    }

    /**
     * How a trace names a unit: the library's ref, the same on every client. Not the handle id:
     * clients hand those out differently (local UI objects take ids on one client only), so the
     * same unit can have a different handle id on each client.
     */
    public static unit(unit: Unit | undefined): number {
        return Slop !== undefined && unit !== undefined ? Slop.ref(unit.handle) : 0;
    }
}
