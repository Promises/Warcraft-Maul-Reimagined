#!/usr/bin/env bash
# Builds are staged into the Warcraft III Maps folder and started from Single Player >
# Custom Game, because -loadfile loads the map without mounting its imported files, so
# every custom texture goes missing. -editor skips the Battle.net login, and the menu path
# is clicked with cliclick (the game ignores synthetic key presses, real clicks work).
#
#   npm run play            stage, launch, click through to the game
#   npm run play -- -m      stage and launch only, click the menus yourself
#   npm run play -- -l      stop in the lobby (after Create) instead of starting the game
#   npm run play -- -b      launch through Battle.net instead of running the game directly
#   npm run play -- -a      drive the menus from the game's own UI instead of clicking them
#
# The game's menus are a web page it serves itself from <install>/_retail_/webui/index.html.
# With -a that page is replaced by tools/webui/index.html, which opens the same websocket the
# menus use and asks the game to create a lobby on the staged map and start it. Anything
# already in that folder (W3Champions installs its overlay there) is backed up first.
#
# The Battle.net route is what W3Champions does: the client is told to launch the game, which
# takes no arguments of ours, and the new process is then picked out by comparing the running
# Warcraft III processes with the ones from before the command. It gives an authenticated
# session, at the cost of the flags: the game pauses whenever its window loses focus.
set -euo pipefail

GAME="/Applications/Warcraft III/_retail_/x86_64/Warcraft III.app/Contents/MacOS/Warcraft III"
BNET="/Applications/Battle.net.app/Contents/MacOS/Battle.net"
WEBUI_DIR="/Applications/Warcraft III/_retail_/webui"
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
stop_at=""
map=""
via_bnet=false
auto_ui=false
for arg in "$@"; do
  case "$arg" in
    -m|--manual) manual=true ;;
    -l|--lobby) stop_at="Create" ;;
    -b|--bnet) via_bnet=true ;;
    -a|--auto) auto_ui=true; manual=true ;;
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

if [[ "$auto_ui" == true ]]; then
  [[ -d "$WEBUI_DIR" ]] || { echo "No webui folder at $WEBUI_DIR" >&2; exit 1; }
  if [[ -f "$WEBUI_DIR/index.html" ]] && ! /usr/bin/grep -q 'wcmaul' "$WEBUI_DIR/index.html"; then
    cp "$WEBUI_DIR/index.html" "$WEBUI_DIR/index.html.before-wcmaul"
    echo "Backed up the page that was in the game's webui folder -> index.html.before-wcmaul"
  fi
  cp "$root/tools/webui/index.html" "$WEBUI_DIR/index.html"
  # Only this launch is driven: the page ignores the file once it has expired
  printf '{"map":"%s","folder":"%s","expires":%s}\n' \
    "$(basename "$STAGED_MAP")" "$(basename "$MAPS_DIR")" \
    "$(( ($(date +%s) + 300) * 1000 ))" > "$WEBUI_DIR/autostart.json"
  echo "The game's own UI will load $(basename "$STAGED_MAP")"
fi

adopted=false
if [[ "$via_bnet" == true ]]; then
  [[ -x "$BNET" ]] || { echo "Battle.net not found at $BNET" >&2; exit 1; }
  if ! pgrep -f "$BNET" >/dev/null; then
    echo "Starting Battle.net..."
    "$BNET" >/dev/null 2>&1 &
    for _ in $(seq 30); do pgrep -f "$BNET" >/dev/null && break; sleep 1; done
    sleep 15
  fi
  before=$( { pgrep -f "MacOS/Warcraft III" || true; } | tr '\n' ' ')
  "$BNET" --exec="launch W3" >/dev/null 2>&1 || true
  echo "Asked Battle.net to launch Warcraft III; waiting for the new process..."
  game_pid=""
  for _ in $(seq 40); do
    for pid in $(pgrep -f "MacOS/Warcraft III" || true); do
      [[ " $before " == *" $pid "* ]] && continue
      game_pid=$pid
      break
    done
    [[ -n "$game_pid" ]] && break
    sleep 2
  done
  [[ -n "$game_pid" ]] || { echo "Battle.net did not start the game" >&2; exit 1; }
  adopted=true
  echo "Warcraft III started by Battle.net (pid $game_pid, no launch flags)"
else
  # -nowfpause: keep the game running when the window is not focused (tiling WM, scripted input)
  "$GAME" -editor -launch -windowmode windowed -nowfpause &
  game_pid=$!
  echo "Warcraft III started (pid $game_pid)"
fi

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
  # The click points are fractions of a 960x628 window, so the window has to be that shape or
  # they land on the wrong menu entries. System Events is ignored by some builds; yabai is not.
  if command -v yabai >/dev/null; then
    wid=$(yabai -m query --windows | python3 -c "import sys,json; ws=[w['id'] for w in json.load(sys.stdin) if w['app']=='Warcraft III']; print(ws[0] if ws else '')" 2>/dev/null || true)
    if [[ -n "$wid" ]]; then
      yabai -m window "$wid" --move "abs:$WINDOW_X:$WINDOW_Y" >/dev/null 2>&1 || true
      yabai -m window "$wid" --resize "abs:$WINDOW_W:$WINDOW_H" >/dev/null 2>&1 || true
    fi
  fi
  osascript -e "tell application \"System Events\" to tell process \"Warcraft III\" to set {position, size} of window 1 to {{$WINDOW_X, $WINDOW_Y}, {$WINDOW_W, $WINDOW_H}}" >/dev/null 2>&1 || true
  sleep 2
  bounds=$(osascript -e 'tell application "System Events" to tell process "Warcraft III" to get {position, size} of window 1' 2>/dev/null || true)
  if [[ -z "$bounds" ]]; then
    echo "Could not read the game window; click through yourself: $MENU_PATH"
  else
    IFS=', ' read -r win_x win_y win_w win_h <<<"$bounds"
    echo "Game window ${win_w}x${win_h} at ${win_x},${win_y}"
    if (( win_w != WINDOW_W || win_h != WINDOW_H )); then
      echo "  the window is not ${WINDOW_W}x${WINDOW_H}, so the menu clicks would miss; click through yourself: $MENU_PATH"
      manual=true
    fi
  fi
  if [[ "$manual" == false && -n "$bounds" ]]; then
    echo "Clicking through to the map..."
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
      [[ "$label" == "$stop_at" ]] && { echo "  stopped in the lobby"; break; }
    done
  fi
fi

echo
echo "Warcraft III running (pid $game_pid) — Ctrl+C to quit it."
if [[ "$adopted" == true ]]; then
  # Not a child of this shell, so wait for it the only way that works for an adopted process
  while kill -0 "$game_pid" 2>/dev/null; do sleep 2; done
else
  wait "$game_pid" 2>/dev/null || true
fi
echo "Warcraft III exited."
