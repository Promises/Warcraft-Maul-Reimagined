#!/usr/bin/env bash
# Runs a Lua file with a Lua 5.3 built for 32-bit integers and floats (LUA_32BITS), as Warcraft
# III's is (math.maxinteger is 2147483647 in game): code that is right on a desktop Lua's 64-bit
# integers can fail there. The interpreter is built once into tools/lua32.
#
#   bash scripts/lua32.sh <dir> <file.lua>     runs <file.lua> from <dir>
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
lua="$root/tools/lua32/lua"
if [ ! -x "$lua" ]; then
    version=5.3.6
    work="$(mktemp -d)"
    curl -sSfL "https://www.lua.org/ftp/lua-$version.tar.gz" | tar xz -C "$work"
    make -s -C "$work/lua-$version" "$( [ "$(uname)" = Darwin ] && echo macosx || echo linux)" MYCFLAGS=-DLUA_32BITS >/dev/null 2>&1
    mkdir -p "$root/tools/lua32"
    cp "$work/lua-$version/src/lua" "$lua"
    rm -rf "$work"
fi
cd "$1"
exec "$lua" "$2"
