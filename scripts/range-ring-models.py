#!/usr/bin/env python3
"""
Builds the range indicator ring models (maps/map.w3x/war3mapImported/RangeRing*.mdx) from
Hive's "Circle Indicator (100, TC)" by ThompZon (Target and Circle Indicator TC VFX, thread
349193; Vinz's Longevity Aura, modified with permission). Its ring is a strip from radius 88
to 100 with the glow texture mapped across the band, so scaling it to a tower's range keeps
the edge sharp but multiplies the band width by the scale. Three variants with thinner bands,
at 96 segments, keep the line 6 to 12 units wide from the smallest to the largest tower range
(see RangeIndicator.ts).

    python3 scripts/range-ring-models.py <CircleIndicator_TC_100.mdx>
"""
import math
import struct
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / 'maps' / 'map.w3x' / 'war3mapImported'
OUTER = 100.0
SEGMENTS = 96
# The ring sits just above the ground; the source's z 18 would float once scaled up
HEIGHT = 0.5
# Band width in the model; the scale the variant is used at makes it 6 to 12 units on screen
VARIANTS = {'RangeRingWide': 4.0, 'RangeRingMid': 1.5, 'RangeRingFine': 0.6}
# Texture mapping of the source strip: u across the band, v a soft brightness sweep along it
U_INNER, U_OUTER = 0.868, 0.133
V_MID, V_SWING, V_PHASE = 0.56, 0.082, math.radians(22.5)


def chunks(data: bytes) -> list[tuple[bytes, bytes]]:
    assert data[:4] == b'MDLX'
    out, p = [], 4
    while p + 8 <= len(data):
        tag, size = data[p:p + 4], struct.unpack('<I', data[p + 4:p + 8])[0]
        out.append((tag, data[p + 8:p + 8 + size]))
        p += 8 + size
    return out


def bounds(radius: float) -> bytes:
    return struct.pack('<f3f3f', radius * math.sqrt(2), -radius, -radius, 0.0, radius, radius, HEIGHT)


def ring_geoset(inner: float) -> bytes:
    verts, uvs, faces = [], [], []
    for i in range(SEGMENTS):
        angle = 2 * math.pi * i / SEGMENTS
        v = V_MID + V_SWING * math.cos(2 * (angle - V_PHASE))
        for radius, u in ((inner, U_INNER), (OUTER, U_OUTER)):
            verts.append((radius * math.cos(angle), radius * math.sin(angle), HEIGHT))
            uvs.append((u, v))
        a, b = 2 * i, 2 * i + 1
        c, d = (2 * i + 2) % (2 * SEGMENTS), (2 * i + 3) % (2 * SEGMENTS)
        faces += [a, b, d, a, d, c]
    n = len(verts)

    def block(tag: bytes, count: int, payload: bytes) -> bytes:
        return tag + struct.pack('<I', count) + payload

    body = b''
    body += block(b'VRTX', n, b''.join(struct.pack('<3f', *v) for v in verts))
    body += block(b'NRMS', n, struct.pack('<3f', 0.0, 0.0, 1.0) * n)
    body += block(b'PTYP', 1, struct.pack('<I', 4))
    body += block(b'PCNT', 1, struct.pack('<I', len(faces)))
    body += block(b'PVTX', len(faces), struct.pack(f'<{len(faces)}H', *faces))
    body += block(b'GNDX', n, bytes(n))
    body += block(b'MTGC', 1, struct.pack('<I', 1))
    body += block(b'MATS', 1, struct.pack('<I', 0))
    body += struct.pack('<3I', 0, 0, 0)  # material, selection group, selection flags
    body += bounds(OUTER)
    body += struct.pack('<I', 3) + bounds(OUTER) * 3  # one extent per sequence
    body += block(b'UVAS', 1, b'')
    body += block(b'UVBS', n, b''.join(struct.pack('<2f', *uv) for uv in uvs))
    return struct.pack('<I', len(body) + 4) + body


def build(source: bytes, inner: float) -> bytes:
    out = b'MDLX'
    for tag, body in chunks(source):
        if tag == b'MODL':
            body = body[:340] + bounds(OUTER) + body[368:]
        elif tag == b'SEQS':
            body = b''.join(body[i:i + 104] + bounds(OUTER) for i in range(0, len(body), 132))
        elif tag == b'GEOS':
            body = ring_geoset(inner)
        out += tag + struct.pack('<I', len(body)) + body
    return out


def main() -> None:
    source = Path(sys.argv[1]).read_bytes()
    for name, band in VARIANTS.items():
        path = OUT_DIR / f'{name}.mdx'
        path.write_bytes(build(source, OUTER - band))
        print(f'{path.name}: band {band}, {path.stat().st_size} bytes')


if __name__ == '__main__':
    main()
