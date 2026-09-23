import {Frame, Trigger} from 'w3ts';
import {WarcraftMaul} from '../../../WarcraftMaul';
import {RaceItemDef} from '../../Races/RaceItems';
import {trackUiPress} from '../UiPress';
import {createBackdrop, onLocalClick} from '../Frames';

const ICON_INSET = 0.003;

/**
 * One row of the race list: an icon and the race name on a text button. Rows are reused as
 * the list scrolls, so setItem repoints an existing row rather than creating frames.
 */
export class RaceListRow {
    private readonly button: Frame;
    private readonly icon: Frame;
    private readonly highlight: Frame;
    private itemId: string | undefined;
    private name: string = '';
    private selected: boolean = false;

    /** Placed with its top-left at (x, y) from the parent's top-left. */
    constructor(game: WarcraftMaul, name: string, parent: Frame, x: number, y: number,
                width: number, height: number, onClick: (itemId: string) => void, onWheel: (up: boolean) => void) {
        // CustomListButton (war3mapImported\\ui\\CustomTextButton.fdf): a text button whose own
        // text is left-justified past the icon. Its hit area matches what is drawn, and the
        // name is the button's text rather than a child TEXT frame, which would swallow clicks.
        this.button = Frame.create('CustomListButton', parent, 0, 0)!;
        this.button.setSize(width, height);
        this.button.setPoint(FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_TOPLEFT, x, y);

        // A dark translucent bar: frame alpha applies reliably where a vertex-colour tint does not
        this.highlight = createBackdrop(`${name}Highlight`, this.button, 'Textures\\Black32.blp');
        this.highlight.setAllPoints(this.button);
        this.highlight.setAlpha(150);
        this.highlight.setVisible(false);

        this.icon = Frame.createType(`${name}Icon`, this.button, 0, 'BACKDROP', '')!;
        this.icon.setSize(height - 2 * ICON_INSET, height - 2 * ICON_INSET);
        this.icon.setPoint(FRAMEPOINT_LEFT, this.button, FRAMEPOINT_LEFT, ICON_INSET, 0);

        // Frame events fire on every client with the acting player; the row only ever shows
        // and changes the local player's view, so other clients ignore the event entirely
        onLocalClick(this.button, () => {
            if (this.itemId !== undefined) {
                onClick(this.itemId);
            }
        });
        const wheel = Trigger.create();
        wheel.triggerRegisterFrameEvent(this.button, FRAMEEVENT_MOUSE_WHEEL);
        wheel.addAction(() => {
            if (GetTriggerPlayer() !== GetLocalPlayer()) {
                return;
            }
            onWheel(Frame.getEventValue() > 0);
        });
        trackUiPress(game, this.button);
    }

    /** Local UI: shows an item, or hides the row when item is undefined. */
    public setItem(item: RaceItemDef | undefined): void {
        this.itemId = item?.id;
        this.button.setVisible(item !== undefined);
        if (item) {
            this.icon.setTexture(item.icon, 0, true);
            this.name = GetLocalizedString(item.name) ?? item.name;
            this.refreshText();
        }
    }

    public setSelected(selected: boolean): void {
        this.selected = selected && this.itemId !== undefined;
        this.highlight.setVisible(this.selected);
        this.refreshText();
    }

    /** The selected name is gold; a colour code in the text is what works on a text button. */
    private refreshText(): void {
        this.button.setText(this.selected ? `|cffffcc00${this.name}|r` : this.name);
    }

    public get item(): string | undefined {
        return this.itemId;
    }
}
