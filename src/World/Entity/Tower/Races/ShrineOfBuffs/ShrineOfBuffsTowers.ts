import { TowerMap } from '../../Specs/TowerMap';
import { RaceTowers } from '../RaceTowers';


export class ShrineOfBuffsTowers extends RaceTowers {
    public AddTowersToList(list: TowerMap<number, object>): void {
        // KodoBeast (the Chaos Kodo Beast, o006; once registered on oC58, Orc Stronghold's
        // Barrelmaster) is kept but not registered: it orders a devour on every attack, and the
        // Kodo has no Devour ability (only Command Aura), so the order fails and does nothing.
        // Register it again once the Kodo gets a Devour:
        //     list.add(FourCC('o006'), KodoBeast);
    }

}
