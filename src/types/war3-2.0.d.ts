// Natives added to common.j after the war3-types-strict/1.33.0 typings in use.
declare const METAKEY_SHIFT: number;
/** Local poll of a modifier key on this client; never use the result for game state directly. */
declare function BlzIsMetaKeyPressed(metakey: number): boolean;
