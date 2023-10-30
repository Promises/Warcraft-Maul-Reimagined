import { Tower } from '../../Specs/Tower';
import { Defender } from '../../../Players/Defender';
import { WarcraftMaul } from '../../../../WarcraftMaul';
import { TickingTower } from '../../Specs/TickingTower';
import {Unit} from "w3ts";

export class StalaggFeugen extends Tower implements TickingTower {
    constructor(tower: Unit, owner: Defender, game: WarcraftMaul) {
        super(tower, owner, game);
        this.AddUpgrade();
    }

    private AddUpgrade(): void {
        const loc: location = GetUnitLoc(this.unit.handle);
        const grp: group = GetUnitsInRangeOfLocMatching(182.00, loc, Condition(() => this.InitializeUpgradeGroupConditions()))!;
        RemoveLocation(loc);
        DestroyGroup(grp);
    }

    public Action(): void {
        this.AddUpgrade();
    }

    public GetTickModulo(): number {
        return 599;
    }

    private InitializeUpgradeGroupConditions(): boolean {
        const unit = Unit.fromHandle(GetFilterUnit());
        if (!unit?.isUnitType(UNIT_TYPE_STRUCTURE)) {
            return false;
        }

        if (unit?.typeId !== FourCC('oC7D') &&
            unit?.typeId !== FourCC('oC7E')) {
            return false;
        }

        if (unit?.id === this.unit.id) {
            return false;
        }

        if (unit?.getAbilityLevel(FourCC('A0F5')) > 0) {
            return false;
        }
        unit?.addAbility(FourCC('A0F5'));
        return true;
    }
}
