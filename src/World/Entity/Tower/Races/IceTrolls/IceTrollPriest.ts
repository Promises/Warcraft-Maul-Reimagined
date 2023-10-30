import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';
import { Log } from '../../../../../lib/Serilog/Serilog';
import {Util} from "../../../../../lib/translators";
import {Unit} from "w3ts";

export class IceTrollPriest extends Tower implements TickingTower {
    private targets: unit[] = [];

    private FrostNova(): void {
        const loc: location = GetUnitLoc(this.unit.handle);
        const grp = GetUnitsInRangeOfLocMatching(500.00, loc, Condition(() => this.InitializeFrostNovaGroupConditions()));
        if (this.targets.length > 0) {
            const indx: number = Util.RandomInt(0, this.targets.length - 1);
            const x: number = this.unit.x;
            const y: number = this.unit.y;
            const dummy = Unit.create(this.owner, FourCC('u008'), x, y, 0);
            dummy?.applyTimedLife(FourCC('BTLF'), 1.00)
            dummy?.addAbility(FourCC('A08J'))
            dummy?.issueTargetOrder('frostnova', Unit.fromHandle(this.targets[indx])!);
        }
        RemoveLocation(loc);
        if(grp) {
            DestroyGroup(grp);
        }
    }

    public Action(): void {

        this.FrostNova();
    }

    public GetTickModulo(): number {
        return 49;
    }


    private InitializeFrostNovaGroupConditions(): boolean {

        if (!(Util.isUnitCreep(GetFilterUnit()!))) {
            // Log.Debug('Not Creep');
            return false;
        }


        if (!IsUnitAliveBJ(GetFilterUnit()!)) {
            // Log.Debug('Dead');
            return false;
        }


        this.targets.push(GetFilterUnit()!);
        return true;
    }
}
