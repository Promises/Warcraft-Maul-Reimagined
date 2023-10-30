import { Tower } from '../../Specs/Tower';
import { TickingTower } from '../../Specs/TickingTower';

export class AncientGolem extends Tower implements TickingTower {

    public Action(): void {
        const mana: number = this.unit.mana + 1;
        this.unit.mana = mana;

        this.unit.setBaseDamage(0, this.unit.getBaseDamage(0) + 75);
        this.unit.setScale(30.0 + (mana * 10), 30.0 + (mana * 10), 30.0 + (mana * 10));

        if (mana > 6) {
            this.game.towerTicker.RemoveTickingTower(this.UniqueID);
        }
    }

    public GetTickModulo(): number {
        return 599;
    }
}
