#!/usr/bin/env bash
# Builds are staged into the Warcraft III Maps folder and started from Single Player >
# Custom Game, because -loadfile loads the map without mounting its imported files, so
# every custom texture goes missing. -editor skips the Battle.net login, and the menu path
# is clicked with cliclick (the game ignores synthetic key presses, real clicks work).
#
#   npm run play            stage, launch, click through to the game
#   npm run play -- -m      stage and launch only, click the menus yourself
set -euo pipefail

GAME="/Applications/Warcraft III/_retail_/x86_64/Warcraft III.app/Contents/MacOS/Warcraft III"
MAPS_DIR="$HOME/Library/Application Support/Blizzard/Warcraft III/Maps/WarcraftMaulDev"
STAGED_MAP="$MAPS_DIR/WarcraftMaulDev.w3x"
MENU_PATH="Single Player > Custom Game > WarcraftMaulDev"

# The window is pinned to this geometry before clicking; yabai floats it (rule in yabairc)
WINDOW_X=${WC3_WINDOW_X:-1920}
WINDOW_Y=${WC3_WINDOW_Y:-35}
WINDOW_W=${WC3_WINDOW_W:-960}
WINDOW_H=${WC3_WINDOW_H:-628}

# Click points as fractions of the game window, measured on a 960x628 window.
MENU_CLICKS=(
  "0.783 0.420 Single Player"
  "0.783 0.393 Custom Games"
  "0.448 0.381 WarcraftMaulDev folder"
  "0.841 0.799 Open folder"
  "0.841 0.799 Create"
  "0.841 0.799 Start game"
  "0.500 0.893 Loading screen"
)

manual=false
map=""
for arg in "$@"; do
  case "$arg" in
    -m|--manual) manual=true ;;
    *) map="$arg" ;;
  esac
done

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
map="${map:-$root/dist/bin/map.w3x}"
[[ -f "$map" ]] || { echo "No map at $map — run 'npm run build' first." >&2; exit 1; }
[[ -x "$GAME" ]] || { echo "Warcraft III not found at $GAME" >&2; exit 1; }

command -v cliclick >/dev/null || { echo "cliclick not found (brew install cliclick); menus must be clicked by hand."; manual=true; }

mkdir -p "$MAPS_DIR"
cp "$map" "$STAGED_MAP"
echo "Staged $(basename "$map") -> Maps/WarcraftMaulDev/WarcraftMaulDev.w3x"

"$GAME" -editor -launch -windowmode windowed &
game_pid=$!
echo "Warcraft III started (pid $game_pid)"

stop_game() { echo; echo "Stopping Warcraft III (pid $game_pid)..."; kill "$game_pid" 2>/dev/null || true; }
trap stop_game INT TERM

if [[ "$manual" == true ]]; then
  echo; echo "  $MENU_PATH"; echo
else
  # Wait for the window to exist, then for the main menu to be drawn
  bounds=""
  for _ in $(seq 40); do
    bounds=$(osascript -e 'tell application "System Events" to tell process "Warcraft III" to get {position, size} of window 1' 2>/dev/null || true)
    [[ -n "$bounds" ]] && break
    sleep 1
  done
  sleep 6
  osascript -e "tell application \"System Events\" to tell process \"Warcraft III\" to set {position, size} of window 1 to {{$WINDOW_X, $WINDOW_Y}, {$WINDOW_W, $WINDOW_H}}" >/dev/null 2>&1 || true
  sleep 1
  bounds=$(osascript -e 'tell application "System Events" to tell process "Warcraft III" to get {position, size} of window 1' 2>/dev/null || true)
  if [[ -z "$bounds" ]]; then
    echo "Could not read the game window; click through yourself: $MENU_PATH"
  else
    IFS=', ' read -r win_x win_y win_w win_h <<<"$bounds"
    echo "Game window ${win_w}x${win_h} at ${win_x},${win_y} — clicking through to the map..."
    osascript -e 'tell application "System Events" to tell process "Warcraft III" to set frontmost to true' >/dev/null 2>&1 || true
    sleep 1
    # The game swallows the first click to focus the window, so spend one on empty artwork
    focus_x=$(printf '%.0f' "$(echo "$win_x + 0.33 * $win_w" | bc -l)")
    focus_y=$(printf '%.0f' "$(echo "$win_y + 0.50 * $win_h" | bc -l)")
    cliclick "c:$focus_x,$focus_y"
    sleep 1
    for entry in "${MENU_CLICKS[@]}"; do
      read -r fx fy label <<<"$entry"
      x=$(printf '%.0f' "$(echo "$win_x + $fx * $win_w" | bc -l)")
      y=$(printf '%.0f' "$(echo "$win_y + $fy * $win_h" | bc -l)")
      echo "  click $label ($x,$y)"
      cliclick "c:$x,$y"
      case "$label" in
        "Start game") sleep 18 ;;
        "Create") sleep 4 ;;
        *) sleep 2.5 ;;
      esac
    done
  fi
fi

echo
echo "Warcraft III running (pid $game_pid) — Ctrl+C to quit it."
wait "$game_pid" 2>/dev/null || true
echo "Warcraft III exited."
