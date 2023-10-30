import { WCItem } from './WCItem';
import {Item, Unit} from "w3ts";

export class StackingItem extends WCItem {

    public StackingCondition(): boolean {
        const manipulatedItem = Item.fromHandle(GetManipulatedItem());
        const manipulatingUnit = Unit.fromHandle(GetManipulatingUnit());

        if (this.itemID !== manipulatedItem?.typeId) {
            return false;
        }
        if (!(UnitHasItemOfTypeBJ(manipulatingUnit!.handle, manipulatedItem.typeId))) {
            return false;
        }

        if (!(manipulatedItem.handle !== GetItemOfTypeFromUnitBJ(manipulatingUnit!.handle, manipulatedItem.typeId))) {
            return false;
        }

        return true;
    }

    public MakeStack(): void {
        const manipulatingUnit = Unit.fromHandle(GetManipulatingUnit());
        const manipulatedItem = Item.fromHandle(GetManipulatedItem());

        let existingItem: Item | null = null;

        if(!manipulatedItem || !manipulatingUnit) {
            return;
        }

        // Iterate through item slots to find an item of the same type
        for (let i = 0; i < manipulatingUnit.inventorySize; i++) {
            const itemInSlot = manipulatingUnit.getItemInSlot(i);
            if (itemInSlot && itemInSlot.typeId === manipulatedItem.typeId) {
                existingItem = itemInSlot;
                break;
            }
        }

        if (existingItem) {
            existingItem.charges += manipulatedItem.charges;
        }

        manipulatingUnit.removeItem(manipulatedItem);
        manipulatedItem.destroy();
    }

    // public MakeStack(): void {
    //     SetItemCharges(GetItemOfTypeFromUnitBJ(GetManipulatingUnit(), GetItemTypeId(GetManipulatedItem())),
    //         (GetItemCharges(GetItemOfTypeFromUnitBJ(GetManipulatingUnit(), GetItemTypeId(GetManipulatedItem()))) + GetItemCharges(GetManipulatedItem())));
    //     UnitRemoveItemSwapped(GetManipulatedItem(), GetManipulatingUnit());
    //     RemoveItem(GetManipulatedItem());
    // }
}
