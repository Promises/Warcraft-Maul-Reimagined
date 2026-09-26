#!/usr/bin/env bash
# Two accounts in one game, from one command.
#
# Both Battle.net clients stay signed in: the normal one, and a copy at "Battle.net Alt.app"
# with its own bundle id and its own data root, started once with
#
#   open -n -a "/Applications/Battle.net Alt.app" \
#        --env CFFIXED_USER_HOME=$ALT_HOME --env HOME=$ALT_HOME
#
# Each game is started from its own client's dock menu (scripts/launch-from-dock.applescript),
# which is what decides the account: the data root only moves the game's files, the session
# comes from the client that starts it, and asking a client directly does not work - its menus
# carry no launch action, its URL scheme only opens the window, and --exec spawns a fresh,
# logged out client rather than talking to the running one.
#
# The alt client keeps its own data root, so its preferences, logs and CustomMapData are its
# own, and its Maps folder holds links to the real one so both instances see the same maps.
#
# Roles are not fixed here: this only brings both games up and leaves them checked in with the
# server, ready to be told anything with wc3-slop-lan's harness/wc3.sh (host, join, start, raw,
# eval, reload). The page, its server and that script live in wc3-slop-lan (../wc3-slop-lan, or
# WC3_SLOP); so does the map library, which is put into the staged copy so both clients write
# the lockstep trace (tools/sync-diff.py compares them after a desync).
# With --drive it also hosts on the test map and joins, the usual two player start.
#
#   bash scripts/play-two.sh [--drive]
set -euo pipefail

WEBUI_DIR="/Applications/Warcraft III/_retail_/webui"
MAIN_CLIENT="${WC3_MAIN_CLIENT:-Battle.net}"
ALT_CLIENT="${WC3_ALT_CLIENT:-Battle.net Alt}"
SERVER="${WC3_SERVER:-http://127.0.0.1:8777}"
# Unique per run: a custom game is listed publicly while it exists, and a name as ordinary
# as "devgame" is one somebody else is using too - the joiner would find theirs
GAME_NAME="${WC3_GAME_NAME:-wm-$(uuidgen | cut -c1-8 | tr '[:upper:]' '[:lower:]')}"
GAME_PASS="${WC3_GAME_PASS:-devtest}"
TEST_MAP="${WC3_TEST_MAP:-WarcraftMaulDev.w3x}"
TEST_FOLDER="${WC3_TEST_FOLDER:-WarcraftMaulDev}"
MAPS_DIR="$HOME/Library/Application Support/Blizzard/Warcraft III/Maps/$TEST_FOLDER"

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SLOP="${WC3_SLOP:-$(dirname "$root")/wc3-slop-lan}"
[[ -f "$SLOP/harness/wc3.sh" ]] || { echo "No wc3-slop-lan at $SLOP (set WC3_SLOP)" >&2; exit 1; }
WC3="$SLOP/harness/wc3.sh"
log="${WC3_TRACE_LOG:-$root/dist/webui-trace.log}"
mkdir -p "$(dirname "$log")"

# The build both games will play: staged where play.sh puts it, so this always runs what was
# built last rather than whatever was left there
BUILT_MAP="${WC3_BUILT_MAP:-$root/dist/bin/map.w3x}"
if [[ -f "$BUILT_MAP" ]]; then
  mkdir -p "$MAPS_DIR"
  # With the library in, for the trace; hidden, since Battle.net has no host seat
  if [[ -x "$SLOP/host/target/debug/wc3-slop-lan" ]] \
      && "$SLOP/host/target/debug/wc3-slop-lan" inject --map "$BUILT_MAP" --out "$MAPS_DIR/$TEST_MAP" >/dev/null; then
    echo "Staged $(basename "$BUILT_MAP") as $TEST_MAP, with the trace library"
  else
    cp "$BUILT_MAP" "$MAPS_DIR/$TEST_MAP"
    echo "Staged $(basename "$BUILT_MAP") as $TEST_MAP (no trace: build wc3-slop-lan's host for it)"
  fi
else
  echo "No build at $BUILT_MAP; playing whatever is staged" >&2
fi

if [[ -f "$WEBUI_DIR/index.html" ]] && ! /usr/bin/grep -qE 'window\.(slop|wcmaul)' "$WEBUI_DIR/index.html" \
    && [[ ! -f "$WEBUI_DIR/index.html.before-slop" ]]; then
  cp "$WEBUI_DIR/index.html" "$WEBUI_DIR/index.html.before-slop"
fi
cp "$SLOP/harness/webui/index.html" "$WEBUI_DIR/index.html"

# One game per account: a second session of the same account kicks the first out of its lobby
pkill -9 -f 'MacOS/Warcraft III' 2>/dev/null || true
sleep 3
pkill -f 'harness/webui/server.py' 2>/dev/null || true
python3 "$SLOP/harness/webui/server.py" "$log" 8777 &
server_pid=$!
sleep 2
curl -s -X POST "$SERVER/reset" -o /dev/null || { echo "The server did not start" >&2; exit 1; }

# Each game must come from its own client's dock menu, or both carry the same account and the
# second login kicks the first out of its lobby
osascript "$root/scripts/launch-from-dock.applescript" "$MAIN_CLIENT" "Warcraft III"
echo "Asked $MAIN_CLIENT for its game"
sleep 30
osascript "$root/scripts/launch-from-dock.applescript" "$ALT_CLIENT" "Warcraft III"
echo "Asked $ALT_CLIENT for its game"

# Both check in with the server as they come up; the first is told to host and the second to
# join once it is there. Anything else can be sent later with $WC3.
for _ in $(seq 40); do
  connected=$(curl -s "$SERVER/instances" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))')
  [[ "$connected" == "2" ]] && break
  sleep 3
done
echo "$connected instance(s) checked in"

if [[ "${1:-}" == "--drive" ]]; then
  "$WC3" host 1 "$TEST_MAP" "$TEST_FOLDER" "$GAME_NAME" "$GAME_PASS" >/dev/null
  sleep 12
  "$WC3" join 2 "$GAME_NAME" "$GAME_PASS" >/dev/null
  echo "Told instance 1 to host \"$GAME_NAME\" and instance 2 to join it"
fi

trap 'kill "$server_pid" 2>/dev/null || true' INT TERM
echo "Server running; $WC3 who shows where they are — Ctrl+C to stop it."
wait "$server_pid" 2>/dev/null || true
