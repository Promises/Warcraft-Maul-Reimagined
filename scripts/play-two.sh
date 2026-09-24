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
# Roles are not fixed here. Each game's web UI page asks the coordinator what to do, so the
# first to come up hosts a password protected lobby on the test map and the second joins it by
# name; the joiner reports its arrival and the host then starts the game.
#
#   bash scripts/play-two.sh
set -euo pipefail

WEBUI_DIR="/Applications/Warcraft III/_retail_/webui"
MAIN_CLIENT="${WC3_MAIN_CLIENT:-Battle.net}"
ALT_CLIENT="${WC3_ALT_CLIENT:-Battle.net Alt}"
SERVER="${WC3_SERVER:-http://127.0.0.1:8777}"
GAME_NAME="${WC3_GAME_NAME:-devgame}"
GAME_PASS="${WC3_GAME_PASS:-devtest}"
TEST_MAP="${WC3_TEST_MAP:-WarcraftMaulDev.w3x}"
TEST_FOLDER="${WC3_TEST_FOLDER:-WarcraftMaulDev}"

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
log="${WC3_TRACE_LOG:-$root/dist/webui-trace.log}"
mkdir -p "$(dirname "$log")"

if [[ -f "$WEBUI_DIR/index.html" ]] && ! /usr/bin/grep -q 'wcmaul' "$WEBUI_DIR/index.html"; then
  cp "$WEBUI_DIR/index.html" "$WEBUI_DIR/index.html.before-wcmaul"
fi
cp "$root/tools/webui/index.html" "$WEBUI_DIR/index.html"
printf '{"coordinator":true}\n' > "$WEBUI_DIR/autostart.json"

# One game per account: a second session of the same account kicks the first out of its lobby
pkill -9 -f 'MacOS/Warcraft III' 2>/dev/null || true
sleep 3
pkill -f 'tools/webui/trace-server.py' 2>/dev/null || true
python3 "$root/tools/webui/trace-server.py" "$log" 8777 &
server_pid=$!
sleep 2
curl -s -X POST "$SERVER/reset" -o /dev/null || { echo "The server did not start" >&2; exit 1; }

osascript "$root/scripts/launch-from-dock.applescript" "$MAIN_CLIENT" "Warcraft III"
echo "Asked $MAIN_CLIENT for its game"
sleep 30
osascript "$root/scripts/launch-from-dock.applescript" "$ALT_CLIENT" "Warcraft III"
echo "Asked $ALT_CLIENT for its game"

# Both check in with the server as they come up; the first is told to host and the second to
# join once it is there. Anything else can be sent later with scripts/wc3.sh.
for _ in $(seq 40); do
  connected=$(curl -s "$SERVER/instances" | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))')
  [[ "$connected" == "2" ]] && break
  sleep 3
done
echo "$connected instance(s) checked in"
"$root/scripts/wc3.sh" host 1 "$TEST_MAP" "$TEST_FOLDER" "$GAME_NAME" "$GAME_PASS" >/dev/null
sleep 12
"$root/scripts/wc3.sh" join 2 "$GAME_NAME" "$GAME_PASS" >/dev/null
echo "Told instance 1 to host \"$GAME_NAME\" and instance 2 to join it"

trap 'kill "$server_pid" 2>/dev/null || true' INT TERM
echo "Server running; scripts/wc3.sh who shows where they are — Ctrl+C to stop it."
wait "$server_pid" 2>/dev/null || true
