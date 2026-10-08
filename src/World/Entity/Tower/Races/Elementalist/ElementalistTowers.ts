import { TowerMap } from '../../Specs/TowerMap';
import { RaceTowers } from '../RaceTowers';
import { Undead } from './Undead';
import { Sapling } from './Sapling';
import { Undead2 } from './Undead2';
import { LowTide } from './LowTide';
import { Bubbles } from './Bubbles';
import { UnchargedRune } from './UnchargedRune';
import { DormantPheonixEgg } from './DormantPheonixEgg';
import { Blaze } from './Blaze';
import { Tornado } from './Tornado';
import { HighTide } from './HighTide';
import { Plague } from './Plague';
import { Lich } from './Lich';
import { Thunderhead } from './Thunderhead';
import { LichKing } from './LichKing';
import { AscendedTower, AttunedTower, MaturePiece } from '../../Specs/AttunedTower';
import { EndlessStorm, Haboob } from './Haboob';
import { Firelord, Inferno } from './Inferno';
import { AvatarOfLife } from './AvatarOfLife';
import { Nordrassil } from './Nordrassil';
import { Mist } from './Mist';
import {
    AVATAR_OF_LIFE, ENDLESS_STORM, EYE_OF_THE_STORM, FIRELORD, HABOOB, HEART_OF_LIFE, INFERNO, LICH, LICH_KING, NORDRASSIL,
    THUNDERHEAD, WORLD_TREE,
} from '../../../../Game/Races/ElementalistPrimals';

// The mature pieces: the top of each line, which gain Attunement (Undead L2, Undead2, has its own class)
const MATURE_PIECES: string[] = [
    'u02B', 'u02D', 'u02F', 'u031', 'u033', 'u035', // Rune L3: Death, Life, Nature, Fire, Air, Water
    'u036', // Tree
    'u037', // Fully Grown Moss
    'u03D', // Sandstorm L2
    'u039', // Purgatory L2
    'u03A', // Decay L2
    'u03C', // Wildfire L3
];


export class ElementalistTowers extends RaceTowers {
    public AddTowersToList(list: TowerMap<number, object>): void {

        // Elementalist
        list.add(FourCC('n00A'), UnchargedRune);
        list.add(FourCC('n026'), Undead);
        list.add(FourCC('u038'), Undead2);
        list.add(FourCC('u01D'), DormantPheonixEgg);
        list.add(FourCC('u01F'), LowTide);
        list.add(FourCC('u029'), HighTide);
        list.add(FourCC('u021'), Sapling);
        list.add(FourCC('u022'), Tornado);
        list.add(FourCC('u026'), Bubbles);
        list.add(FourCC('u027'), Blaze);
        list.add(FourCC('u020'), Plague);
        list.add(FourCC('u028'), Mist);
        list.add(FourCC(LICH), Lich);
        list.add(FourCC(THUNDERHEAD), Thunderhead);
        list.add(FourCC(LICH_KING), LichKing);
        list.add(FourCC(EYE_OF_THE_STORM), AscendedTower);
        list.add(FourCC(HABOOB), Haboob);
        list.add(FourCC(ENDLESS_STORM), EndlessStorm);
        list.add(FourCC(HEART_OF_LIFE), AttunedTower);
        list.add(FourCC(AVATAR_OF_LIFE), AvatarOfLife);
        list.add(FourCC(WORLD_TREE), AttunedTower);
        list.add(FourCC(NORDRASSIL), Nordrassil);
        list.add(FourCC(INFERNO), Inferno);
        list.add(FourCC(FIRELORD), Firelord);
        for (const id of MATURE_PIECES) {
            list.add(FourCC(id), MaturePiece);
        }
    }

}
