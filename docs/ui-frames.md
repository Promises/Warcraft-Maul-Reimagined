# Custom UI: the game's frame types and button templates

Compiled from the game's own FDF sources (`war3.w3mod/ui/framedef`, Reforged data; a copy of
the game data lives on `/Volumes/media/shared/Warcraft 3`). Sizes are in screen units
(0.8 wide x 0.6 high at 4:3).

## How a frame gets created

| Call | What it does | Requirement |
|---|---|---|
| `BlzCreateFrame("Name", parent, priority, id)` | Instantiates a *top-level* FDF definition, children included | The FDF must be loaded: through a TOC of ours (`BlzLoadTOCFile`) or because the game loaded it itself (see below). `Frame.create` in w3ts |
| `BlzCreateFrameByType("TYPE", "name", parent, "Inherits", id)` | A bare frame of a base type; `Inherits` copies a template's look, `""` for none | Nothing to load. `Frame.createType` in w3ts |
| `BlzCreateSimpleFrame("Name", parent, id)` | Frames of the *simple* layer (`SIMPLEFRAME`, `SIMPLEBUTTON`, `SIMPLESTATUSBAR`...) | Same as `BlzCreateFrame`, simple FDF |

Only definitions at the top level of an FDF can be instantiated; children (`ButtonText`,
backdrops named inside a button) are reached with `BlzFrameGetChild` / `Frame.getChild`.

Loaded by the game in a match, no TOC needed: `EscMenuTemplates.fdf` (and the ESC panels),
`ScriptDialog.fdf`, `QuestDialog.fdf`, `ConsoleUI.fdf`, `UpperButtonBar.fdf`, the info
panels, timer/alliance/chat dialogs. **Not** loaded in a match: everything under `Glue\`
(`StandardTemplates`, `BattleNetTemplates`, `ScoreScreen`, menus) - our
`uiImport\Templates.toc` and `war3mapImported\ui\templates.toc` include the two template
files, which is why `StandardButtonTemplate` works for the action bar.

## Base frame types (what `BlzCreateFrameByType` takes)

| Type | Behaviour |
|---|---|
| `BUTTON` | Click / hover / tooltip, no visuals of its own. Give it a `BACKDROP` child for an icon (`IconButton`, the action bar). |
| `TEXTBUTTON` | `BUTTON` that owns a text (`ButtonText`), so `BlzFrameSetText` works. Glue-screen buttons (`StandardButtonTemplate`) are this. |
| `GLUEBUTTON` | `BUTTON` with menu behaviour: normal/pushed/disabled backdrops, mouse-over highlight, click sound. |
| `GLUETEXTBUTTON` | `GLUEBUTTON` + own text. The ESC menu buttons, `ScriptDialogButton`, our `CustomTextButton`. |
| `GLUECHECKBOX` / `CHECKBOX` | Toggle with checked/unchecked art; `FRAMEEVENT_CHECKBOX_CHECKED` / `_UNCHECKED`. Radio buttons are this type with radio art. |
| `POPUPMENU` + `MENU` | Dropdown (title button, arrow button, menu); `FRAMEEVENT_POPUPMENU_ITEM_CHANGED`. |
| `SLIDER` | `FRAMEEVENT_SLIDER_VALUE_CHANGED`; `BlzFrameSetValue/MinMaxValue/StepSize`. |
| `SCROLLBAR` | A slider with inc/dec buttons; same events. |
| `EDITBOX` | Text input; `FRAMEEVENT_EDITBOX_TEXT_CHANGED`, `_ENTER`. The text is **local**: read it on the typing client and sync it. |
| `TEXTAREA`, `LISTBOX` | Scrolling text / list. |
| `SIMPLEBUTTON` | Simple-layer button with `NormalTexture/PushedTexture/DisabledTexture` (the Quests/Menu buttons top-left). |

## How the ESC menu's "End Game" is built

`ui\escmenumainpanel.fdf`:

```
Frame "GLUETEXTBUTTON" "EndGameButton" INHERITS WITHCHILDREN "EscMenuButtonTemplate" {
    ButtonText "EndGameButtonText",
    Frame "TEXT" "EndGameButtonText" INHERITS "EscMenuButtonTextTemplate" {
        Text "KEY_END_GAME",
    }
}
```

and the template it inherits (`ui\escmenutemplates.fdf`):

```
Frame "GLUETEXTBUTTON" "EscMenuButtonTemplate" {
    Width 0.228, Height 0.035,
    ControlStyle "AUTOTRACK|HIGHLIGHTONMOUSEOVER",
    ButtonPushedTextOffset 0.002f -0.002f,
    ControlBackdrop "ButtonBackdropTemplate",            // EscMenuButtonBackdropTemplate
    ControlPushedBackdrop "ButtonPushedBackdropTemplate",
    ControlDisabledBackdrop "ButtonDisabledBackdropTemplate",
    ControlMouseOverHighlight "ButtonMouseOverHighlightTemplate",
}
```

That is exactly our `CustomTextButton` / `CustomListButton` (`war3mapImported\ui\CustomTextButton.fdf`),
and what `ScriptDialogButton` (the trigger dialog button) is too. Every labelled button in
the map is an End Game button with different text.

## Template inventory

Top-level, instantiable definitions. `<-` = inherits.

### `UI\FrameDef\UI\EscMenuTemplates.fdf` (in-game look: parchment; loaded in a match)

| Template | Type | Size | Note |
|---|---|---|---|
| `EscMenuButtonTemplate` | GLUETEXTBUTTON | 0.228 x 0.035 | **The standard button.** Verified. |
| `EscMenuCheckBoxTemplate` | GLUECHECKBOX | 0.024 x 0.024 | |
| `EscMenuRadioButtonTemplate` | GLUECHECKBOX | 0.016 x 0.016 | Round radio art; mutual exclusion is your code |
| `EscMenuPopupMenuTemplate` | POPUPMENU | 0.112 x 0.030 | Uses `EscMenuPopupMenuMenuTemplate`, `...TitleTemplate`, `...ArrowTemplate` |
| `EscMenuSliderTemplate` | SLIDER | 0.139 x 0.012 | |
| `EscMenuScrollBarTemplate` | SCROLLBAR | 0.012 wide | Verified (race list) |
| `EscMenuEditBoxTemplate` | EDITBOX | h 0.040 | Verified (`CustomEditBox`) |
| `EscMenuTextAreaTemplate` | TEXTAREA | | |
| Text: `EscMenuButtonTextTemplate`, `EscMenuTitleTextTemplate`, `EscMenuLabelTextTemplate`, `EscMenuLabelTextSmallTemplate`, `EscMenuInfoTextTemplate` | TEXT | | |
| Backdrops: `EscMenuButtonBackdropTemplate` (+Pushed/Disabled/DisabledPushed), `EscMenuControlBackdropTemplate`, `EscMenuBackdrop` (panel) | BACKDROP | | |

### `UI\FrameDef\UI\ScriptDialog.fdf`, `QuestDialog.fdf`, `UpperButtonBar.fdf` (loaded in a match)

| Template | Type | Size | Note |
|---|---|---|---|
| `ScriptDialogButton` | GLUETEXTBUTTON | as EscMenu | `<- EscMenuButtonTemplate`, own text child `ScriptDialogButtonText`. Verified. |
| `QuestButtonTemplate` | GLUEBUTTON | 0.18 x 0.06 | The F9 quest entries |
| `QuestCheckBox` / `QuestCheckBox2` / `QuestCheckBox3` | GLUECHECKBOX | 0.024 / 0.012 | `<- EscMenuCheckBoxTemplate` |
| `UpperButtonBarButtonTemplate` | SIMPLEBUTTON | 0.085 x 0.022 | Quests / Menu buttons top-left; simple layer |

### `UI\FrameDef\Glue\StandardTemplates.fdf` (menu look: blue-grey; needs a TOC)

| Template | Type | Size | Note |
|---|---|---|---|
| `StandardButtonTemplate` | TEXTBUTTON | 0.179 x 0.031 | Verified (action bar + backdrop child) |
| `StandardBorderedButtonTemplate` | TEXTBUTTON | 0.179 x 0.031 | Bordered variant (main menu Replay/Browser) |
| `StandardSmallButtonTemplate` | TEXTBUTTON | 0.179 x 0.031 | |
| `CampaignButtonTemplate` | TEXTBUTTON | 0.179 x 0.036 | Campaign-screen look |
| `CampaignArrowButtonTemplate`, `CampaignCameraButtonTemplate` | TEXTBUTTON | 0.032 x 0.032 | Icon-sized |
| `StandardIconicButtonTemplate` | GLUEBUTTON | 0.031 x 0.031 | Icon button |
| `StandardCheckBoxTemplate` | CHECKBOX | 0.024 x 0.024 | |
| `StandardPopupMenuTemplate` / `CampaignPopupMenuTemplate` | POPUPMENU | 0.112 x 0.019 | Small/ExtraSmall menu + title + arrow variants exist |
| `StandardSliderTemplate` | SLIDER | h 0.016 | |
| `StandardScrollBarTemplate` | SCROLLBAR | 0.0165 wide | |
| `StandardEditBoxTemplate`, `StandardDecoratedEditBoxTemplate` | EDITBOX | h 0.040 | |
| `StandardListBoxTemplate` | LISTBOX | | |
| Backdrops: `StandardButtonBackdropTemplate` (+Pushed/Disabled), `StandardBorderedButton...`, `StandardSmallButton...`, `StandardCampaignButton...`, `StandardHeavy/Medium/LightBackdropTemplate`, `StandardControlBackdropTemplate`, `StandardMenu*ButtonBaseBackdrop` (0.256 x 0.064 main-menu plates) | BACKDROP | | `ButtonBackdropTemplate` is the child name inside these buttons, what `IconButton` inherits |

### `UI\FrameDef\Glue\BattleNetTemplates.fdf` (TFT menu look; needs a TOC)

| Template | Type | Size |
|---|---|---|
| `BattleNetButtonTemplate` | TEXTBUTTON | 0.179 x 0.031 |
| `BattleNetBorderedButtonTemplate` | TEXTBUTTON | 0.179 x 0.031 |
| `BattleNetRadioButtonTemplate` | CHECKBOX | 0.024 x 0.024 |
| `BattleNetPopupMenuTemplate` (+ Menu/Title/Arrow) | POPUPMENU | 0.112 x 0.031 |
| `BattleNetSliderTemplate` | SLIDER | h 0.022 |
| `BattleNetScrollBarTemplate` | SCROLLBAR | 0.0165 wide |
| `BattleNetEditBoxTemplate` | EDITBOX | h 0.040 |
| `BattleNetTextAreaTemplate`, `BattleNetListBoxTemplate` | | |

### Other screens (need their own FDF in a TOC; mostly curiosities)

`ScoreScreenBottomButtonTemplate` (GLUETEXTBUTTON 0.1745 x 0.029), `ScoreScreenTabButtonTemplate`
(BUTTON 0.1 x 0.03), `ScoreScreen4/5ColumnButtonTemplate`, `ScoreScreenBottomCheckButtonTemplate`
(`Glue\ScoreScreen.fdf`); `IconButtonTemplate` 0.031 (`BattleNetMain.fdf`), `IconicButtonTemplate`
0.038 (`BattleNetChatPanel.fdf`), `ClanButtonTemplate`, `LadderButtonTemplate` 0.032
(`BattleNetProfilePanel.fdf`); `ChatroomButtonTemplate` (`BattleNetCustomPanel.fdf`); the
`*PopupMenuTemplate` of each menu screen.

## What we have verified on Reforged 2.0

1. A labelled clickable button: `GLUETEXTBUTTON` inheriting `EscMenuButtonTemplate` (or
   `ScriptDialogButton`), text set on the button itself. A `BUTTON`/`GLUEBUTTON` with a `TEXT`
   child has a hit area that does not match what is drawn, and the child swallows clicks
   (the host settings and race list rows both had to be rebuilt this way).
2. An icon button: `BUTTON` + `BACKDROP` child inheriting `ButtonBackdropTemplate`, texture via
   `BlzFrameSetTexture`. Tooltip: `BoxedText` from our FDF, `BlzFrameSetTooltip`.
3. `BlzFrameSetVertexColor` does not take on backdrops; `BlzFrameSetAlpha` and a colour code in
   the text do.
4. Frame events fire on every client with `GetTriggerPlayer()` = the clicker; gate view changes
   to the local player and sync anything that changes the game (see `PlayerSync`).
5. Templates of a family only exist once that family's FDF is loaded; ESC-menu ones are always
   there in a match, glue ones only through our TOCs.
