import {AbstractActionButton} from './AbstractActionButton';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {Frame} from 'w3ts';

/**
 * Opens and closes the Elementalist's recipe book. Shown to Elementalist players only. The book
 * is a local view, so only the clicker's client toggles it.
 */
export class RecipeBookButton extends AbstractActionButton {
    private static readonly Icon: string = 'ReplaceableTextures\\CommandButtons\\BTNTomeBrown.blp';

    constructor(game: WarcraftMaul, rail: Frame, offsetX: number, size: number, idx: number = 0) {
        super(game, `recipeBookButton${idx}`, RecipeBookButton.Icon, rail, offsetX, size);
        this.setTooltip('Recipe book', 'The fusions you have discovered, and how many are still to find. |cffffcc00-book|r');
    }

    public clickAction(): void {
        const player = this.game.players.get(GetPlayerId(GetTriggerPlayer()!));
        if (player) {
            this.game.recipeBook.togglePanel(player);
        }
    }
}
