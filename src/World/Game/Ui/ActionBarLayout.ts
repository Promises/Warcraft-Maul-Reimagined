// Geometry of the action bar rail, shared by the bar and its buttons, all placed with absolute
// points. Custom UI hangs off the world frame so the game's dialogs (message log, ESC menu)
// draw over it; the console artwork does too, so the rail sits just above the console (its
// art ends at y 0.176) rather than on its ledge.
export const RAIL_CENTER_X = 0.4;
export const RAIL_CENTER_Y = 0.16;
export const RAIL_HEIGHT = 0.042;
export const RAIL_PADDING = 0.012;
export const BUTTON_SIZE = 0.026;
export const BUTTON_PITCH = 0.032;
