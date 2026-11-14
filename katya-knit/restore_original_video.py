#!/usr/bin/env python3
"""Reassemble the exact original KATYA KNIT mobile hero video from GitHub parts."""
from pathlib import Path
import hashlib
root = Path(__file__).resolve().parent
stem = "mobile-hero-1080x1920.mp4"
sources = [root / "masters" / (stem + f".part{i:02}") for i in range(1, 6)]
dest = root / "assets" / "hero-mobile-final-loop-original.mp4"
if not all(p.exists() for p in sources):
    raise SystemExit("Missing one or more original video chunks")
dest.parent.mkdir(parents=True, exist_ok=True)
with dest.open("wb") as writer:
    for p in sources:
        with p.open("rb") as reader:
            for block in iter(lambda: reader.read(1024 * 1024), b""):
                writer.write(block)
sha256 = hashlib.sha256(dest.read_bytes()).hexdigest()
expected = "0fd50916c1867c40e5082a0db438234b68fb4bf1968581cf868e215922042ebc"
if sha256 != expected:
    dest.unlink(missing_ok=True)
    raise SystemExit(f"SHA-256 mismatch: {sha256}")
print(f"Restored {dest} ({dest.stat().st_size} bytes)")
