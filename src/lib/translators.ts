// tslint:disable-next-line:class-name
import {Image, Item, Unit} from "w3ts";

export class console {
    public static log(input: string): void {
        SendMessage(input);
    }
}

export function DecodeFourCC(fourcc: number): string {
    // tslint:disable-next-line:no-bitwise
    return string.char((fourcc >>> 24) & 255, (fourcc >>> 16) & 255, (fourcc >>> 8) & 255, (fourcc) & 255);
}

export function SendMessage(this: void, msg: any): void {
    if (bj_FORCE_ALL_PLAYERS) {
        DisplayTimedTextToForce(bj_FORCE_ALL_PLAYERS, 10, `${msg}`);
        return;
    }
    print(msg)
}

export function SendMessageUnlogged(this: void, msg: any): void {
    SendMessage(`${msg}`);
}


export enum CREEP_TYPE {
    NORMAL,
    AIR,
    CHAMPION,
    BOSS,
}

export enum ARMOUR_TYPE {
    UNARMOURED,
    LIGHT,
    MEDIUM,
    HEAVY,
    FORTIFIED,
    HERO,

}

export interface ColourToIndex {
    [key: string]: number;
}

export class Util {

    public static COLOUR_IDS: ColourToIndex = {
        RED: 0,
        BLUE: 1,
        TEAL: 2,
        PURPLE: 3,
        YELLOW: 4,
        ORANGE: 5,
        GREEN: 6,
        PINK: 7,
        GRAY: 8,
        GREY: 8,
        LIGHT_BLUE: 9,
        LIGHTBLUE: 9,
        LB: 9,
        DARK_GREEN: 10,
        DARKGREEN: 10,
        DG: 10,
        BROWN: 11,
        MAROON: 12,
        NAVY: 13,
        TURQUOISE: 14,
        VOILET: 15,
        WHEAT: 16,
        PEACH: 17,
        MINT: 18,
        LAVENDER: 19,
        COAL: 20,
        SNOW: 21,
        EMERALD: 22,
        PEANUT: 23,
    };

    public static isUnitCreep(u: unit): boolean {
        const ownerID: COLOUR = GetPlayerId(GetOwningPlayer(u));
        switch (ownerID) {
            case COLOUR.NAVY:
            case COLOUR.TURQUOISE:
            case COLOUR.VOILET:
            case COLOUR.WHEAT:
                return true;
            default:
                return false;
        }
    }

    public static ColourString(colour: string, str: string): string {
        return `|cFF${colour.substr(1)}${str}|r`;
    }

    public static RandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    public static ShuffleArray(arr: any[]): void {
        for (let i: number = arr.length - 1; i > 0; i--) {
            const j: number = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
            // [arr[i], arr[j]] = [arr[j], arr[i]]; // swap elements

            const temp: any = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }


    public static RandomHash(length: number): string {
        let result: string = '';
        const characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength: number = characters.length;
        for (let i: number = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }


    public static GetRandomKey(collection: Map<any, any>): any {
        const index: number = Math.floor(Math.random() * collection.size);
        let cntr: number = 0;
        for (const key of collection.keys()) {
            if (cntr++ === index) {
                return key;
            }
        }
    }

    public static GetAllKeys(collection: Map<any, any>): any[] {
        const keys: any[] = [];
        for (const key of collection.keys()) {
            keys.push(key);
        }
        return keys;
    }

    public static ArraysToString(arr: any[]): string {
        let output: string = '[';
        for (let i: number = 0; i < arr.length; i++) {
            if (i === arr.length - 1) {
                output += `"${arr[i]}"`;
                continue;
            }
            output += `"${arr[i]}", `;
        }
        output += ']';
        return output;
    }

    public static ParseInt(str: string): number {
        return +str;
    }

    public static ParsePositiveInt(str: string): number {
        const int: number = Number(str);
        if (int < 0) {
            return 0;
        }
        return int;
    }

    public static Round(x: number): number {
        return Math.floor(x + 0.5 - (x + 0.5) % 1);
    }
}

export enum COLOUR {
    RED,
    BLUE,
    TEAL,
    PURPLE,
    YELLOW,
    ORANGE,
    GREEN,
    PINK,
    GRAY,
    LIGHT_BLUE,
    DARK_GREEN,
    BROWN,
    MAROON,
    NAVY,
    TURQUOISE,
    VOILET,
    WHEAT,
    PEACH,
    MINT,
    LAVENDER,
    COAL,
    SNOW,
    EMERALD,
    PEANUT,
}


export const createImage = (imagePath: string, size: number, x: number, y: number, z: number) => new Image(imagePath, size, size, 0, x - (size / 2), y - (size / 2), z, 0, 0, 0, 2)!;

enum UnitStateMethod {
    DEFAULTS,
    RELATIVE,
    ABSOLUTE,
    MAXIMUM
};

export function ReplaceUnit(oldUnit: Unit | undefined, newUnitId: number, unitStateMethod?: UnitStateMethod): Unit | undefined {
    ReplaceUnitBJ
    let newUnit: Unit | undefined;
    let wasHidden: boolean;


    // If we have bogus data, don't attempt the replace.
    if (!oldUnit) {
        bj_lastReplacedUnit = oldUnit;
        return oldUnit;
    }

    // Hide the original unit.
    wasHidden = !oldUnit.show;
    oldUnit.show = false;

    // Create the replacement unit.
    if (newUnitId === FourCC('ugol')) {
        const handle = CreateBlightedGoldmine(oldUnit.owner.handle, oldUnit.x, oldUnit.y, oldUnit.facing);
        newUnit = Unit.fromHandle(handle)
    } else {
        newUnit = Unit.create(oldUnit.owner, newUnitId, oldUnit.x, oldUnit.y, oldUnit.facing);
    }

    if (!newUnit) {
        bj_lastReplacedUnit = oldUnit.handle;
        return oldUnit;
    }

    // Set the unit's life and mana according to the requested method.
    switch (unitStateMethod) {
        case UnitStateMethod.RELATIVE:
            // Set the replacement's current/max life ratio to that of the old unit.
            // If both units have mana, do the same for mana.
            if (oldUnit.maxLife > 0) {
                const oldRatio = oldUnit.life / oldUnit.maxLife
                newUnit.life = oldRatio * newUnit.maxLife;
            }
            if (oldUnit.maxMana > 0) {
                const oldRatio = oldUnit.mana / oldUnit.maxMana
                newUnit.mana = oldRatio * newUnit.maxMana;
            }
            break;
        case UnitStateMethod.ABSOLUTE:
            // Set the replacement's current life to that of the old unit.
            // If the new unit has mana, do the same for mana.
            newUnit.life = oldUnit.life
            if (oldUnit.maxMana > 0) {
                newUnit.mana = oldUnit.mana;
            }
            break;

        case UnitStateMethod.MAXIMUM:
            // Use max life and mana.
            newUnit.life = oldUnit.maxLife;
            newUnit.mana = oldUnit.maxMana;
            break;
        case UnitStateMethod.DEFAULTS:
        default:
            // The newly created unit should already have default life and mana.
            break;

    }
    // Mirror properties of the old unit onto the new unit.
    // newUnit.paused = oldUnit.paused;
    newUnit.resourceAmount = oldUnit.resourceAmount;

    // If both the old and new units are heroes, handle their hero info.
    if (oldUnit.isHero() && newUnit.isHero()) {
        newUnit.experience = oldUnit.experience;
        for (let i = 0; i <= bj_MAX_INVENTORY; i++) {
            const oldItem = oldUnit.getItemInSlot(i);
            if (oldItem) {
                oldUnit.removeItem(oldItem);
                newUnit.removeItem(oldItem);
            }
        }
    }

    // Remove or kill the original unit.  It is sometimes unsafe to remove
    // hidden units, so kill the original unit if it was previously hidden.
    if (wasHidden) {
        oldUnit.kill();
        oldUnit.destroy();
    } else {
        oldUnit.destroy();
    }
    bj_lastReplacedUnit = newUnit.handle;
    return newUnit;
}

