#!/usr/bin/env python3
"""PNG icons for Android install (Chrome rejects SVG-only manifests)."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"
GREEN = (74, 90, 58, 255)
CREAM = (246, 241, 230, 255)


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path: Path, size: int, pixels: list[tuple[int, int, int, int]]) -> None:
    raw = b""
    for y in range(size):
        raw += b"\x00"
        row = pixels[y * size : (y + 1) * size]
        raw += b"".join(bytes(px) for px in row)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    )


def rounded_rect(x: float, y: float, size: int, radius: float) -> bool:
    if radius <= x <= size - 1 - radius and 0 <= y <= size - 1:
        return True
    if radius <= y <= size - 1 - radius and 0 <= x <= size - 1:
        return True
    corners = (
        (radius, radius),
        (size - 1 - radius, radius),
        (radius, size - 1 - radius),
        (size - 1 - radius, size - 1 - radius),
    )
    return any((x - cx) ** 2 + (y - cy) ** 2 <= radius**2 for cx, cy in corners)


def draw_icon(size: int, *, maskable: bool = False) -> list[tuple[int, int, int, int]]:
    pad = int(size * (0.18 if maskable else 0.0))
    inner = size - pad * 2
    radius = inner * 0.22
    cx = cy = size / 2
    ring_r = inner * 0.28
    ring_w = max(2.0, inner * 0.06)
    dot_r = inner * 0.08
    pixels: list[tuple[int, int, int, int]] = []
    for y in range(size):
        for x in range(size):
            if maskable:
                color = CREAM
            else:
                color = (0, 0, 0, 0)
            lx = x - pad
            ly = y - pad
            if 0 <= lx < inner and 0 <= ly < inner and rounded_rect(lx, ly, inner, radius):
                color = GREEN
            dist = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            if abs(dist - ring_r) <= ring_w / 2:
                color = CREAM
            if dist <= dot_r:
                color = CREAM
            pixels.append(color)
    return pixels


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    write_png(ROOT / "icon-192.png", 192, draw_icon(192))
    write_png(ROOT / "icon-512.png", 512, draw_icon(512))
    write_png(ROOT / "icon-maskable-512.png", 512, draw_icon(512, maskable=True))
    write_png(ROOT / "apple-touch-icon.png", 180, draw_icon(180))
    print("icons written")


if __name__ == "__main__":
    main()
