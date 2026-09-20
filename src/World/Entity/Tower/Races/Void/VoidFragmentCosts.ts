/**
 * Void buildings bought with void fragments, by unit type. The purchase abilities (A0BB,
 * A0BJ, A0BK, A0BL) are build abilities whose mana cost is the fragment price; the script
 * deducts the same amount from the player's fragments when the ability is cast. A cancelled
 * construction refunds gold natively but neither the mana nor the fragments, so the cancel
 * handler looks the price up here to give both back.
 */
export const VOID_FRAGMENT_COSTS: { [unitTypeId: string]: number } = {
    h00T: 100,  // Void Being
    h008: 400,  // Void Beast
    h021: 800,  // Void Monstrosity
    h01O: 1200, // Void Lord
};

export const VOID_FRAGMENT_CAP = 2000;
