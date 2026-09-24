-- Starts a game from a Battle.net client's dock menu. Each client has its own dock entry, so
-- this is how a specific client, and therefore a specific account, is asked for its game: the
-- client's own menus carry no launch action, its URL scheme only opens the window, and --exec
-- spawns a fresh, logged out client rather than talking to the running one.
on launchFromDock(dockName, gameName)
    tell application "System Events" to tell process "Dock"
        set icon to first UI element of list 1 whose name is dockName
        perform action "AXShowMenu" of icon
        delay 0.6
        perform action "AXPress" of (menu item gameName of menu 1 of icon)
    end tell
end launchFromDock

on run argv
    set dockName to item 1 of argv
    if (count of argv) > 1 then
        set gameName to item 2 of argv
    else
        set gameName to "Warcraft III"
    end if
    launchFromDock(dockName, gameName)
end run
