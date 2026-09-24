#!/usr/bin/env bash
# Talks to the management server (tools/webui/trace-server.py), which relays to the running
# games. Instances are numbered in the order they check in.
#
#   scripts/wc3.sh who                              what is connected and where it is
#   scripts/wc3.sh host 1 <map.w3x> [folder] [name] [password]
#   scripts/wc3.sh join 2 <name> [password]
#   scripts/wc3.sh start 1
#   scripts/wc3.sh leave 2
#   scripts/wc3.sh raw 1 GetMapList '{"useLastMap":true}'
set -euo pipefail
SERVER="${WC3_SERVER:-http://127.0.0.1:8777}"
MAPS="$HOME/Library/Application Support/Blizzard/Warcraft III/Maps"

verb="${1:-who}"
case "$verb" in
  who)
    curl -s "$SERVER/instances" | python3 -m json.tool
    ;;
  host)
    to="${2:-1}"; map="${3:?map file}"; folder="${4:-}"; name="${5:-devgame}"; pass="${6:-devtest}"
    dir="${WC3_MAP_DIR:-$MAPS/}"
    curl -s -X POST "$SERVER/command" -d "$(python3 -c "
import json,sys
print(json.dumps({'to': sys.argv[1], 'verb': 'host', 'map': sys.argv[2], 'folder': sys.argv[3],
                  'directory': sys.argv[4], 'gameName': sys.argv[5], 'password': sys.argv[6]}))
" "$to" "$map" "$folder" "$dir" "$name" "$pass")" | python3 -m json.tool
    ;;
  join)
    to="${2:-2}"; name="${3:-devgame}"; pass="${4:-devtest}"
    curl -s -X POST "$SERVER/command" -d "{\"to\":\"$to\",\"verb\":\"join\",\"gameName\":\"$name\",\"password\":\"$pass\"}" | python3 -m json.tool
    ;;
  start|leave)
    to="${2:-all}"
    curl -s -X POST "$SERVER/command" -d "{\"to\":\"$to\",\"verb\":\"$verb\"}" | python3 -m json.tool
    ;;
  raw)
    to="${2:?instance}"; message="${3:?message}"; payload="${4:-{\}}"
    curl -s -X POST "$SERVER/command" -d "{\"to\":\"$to\",\"verb\":\"raw\",\"message\":\"$message\",\"payload\":$payload}" | python3 -m json.tool
    ;;
  reset)
    curl -s -X POST "$SERVER/reset" -o /dev/null && echo 'instances cleared'
    ;;
  *)
    /usr/bin/sed -n '2,12p' "$0"
    exit 1
    ;;
esac
