import { Tower } from '../../Specs/Tower';
import { AttackActionTower } from '../../Specs/AttackActionTower';
import { KillingActionTower } from '../../Specs/KillingActionTower';

export class VoidCorrupter extends Tower implements AttackActionTower, KillingActionTower {
    public AttackAction(): void {
        const u: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventSource;
        const target: unit | undefined = this.game.gameDamageEngineGlobals.udg_DamageEventTarget;

        if (u === this.unit.handle && target) {
            BlzSetUnitArmor(target, BlzGetUnitArmor(target) - 0.25);
        }
    }

    public KillingAction(): void {
        if (GetKillingUnitBJ() === this.unit.handle) {
            CreateTextTagUnitBJ('TRIGSTR_7925', this.unit.handle, 0, 10, 100, 100, 100, 0);
            SetTextTagVelocityBJ(GetLastCreatedTextTag()!, 40.00, 90);
            SetTextTagPermanentBJ(GetLastCreatedTextTag()!, false);
            SetTextTagLifespanBJ(GetLastCreatedTextTag()!, 4.00);
            SetTextTagFadepointBJ(GetLastCreatedTextTag()!, 2.00);
            this.owner.SetVoidFragments(this.owner.GetVoidFragments() + 5);
            if (this.owner.getVoidBuilder()) {
                this.owner.getVoidBuilder()!.mana = this.owner.GetVoidFragments();
            }

        }
    }
}
