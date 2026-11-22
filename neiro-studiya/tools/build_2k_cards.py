#!/usr/bin/env python3
"""FORMA AI Black Cinema V20 — reproducible 2K luxury card artwork.
Preserves source content and develops a consistent high-end visual grade.
Upsampling older low-resolution sources does not invent native photographic detail.
Generated for the GitHub Pages artifact; source pictures remain available in Git.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFilter
import math

ROOT = Path(__file__).resolve().parent.parent / "web" / "assets"
OUT = (2048, 1152)
ARTWORK = {
    "hero-mobius.webp": ("hero", (0.5, 0.5)),
    "service-apps.webp": ("digital", (0.54, 0.46)),
    "service-photogrammetry.webp": ("scan", (0.51, 0.47)),
    "service-architecture.webp": ("architecture", (0.5, 0.48)),
    "service-film.webp": ("film", (0.52, 0.46)),
    "service-cgi.webp": ("portrait", (0.5, 0.4)),
    "service-worlds.webp": ("worlds", (0.5, 0.45)),
    "project-achron.webp": ("poster", (0.5, 0.42)),
    "project-dome.webp": ("poster", (0.5, 0.47)),
    "project-gods.webp": ("poster", (0.5, 0.38)),
    "about-cyborg.webp": ("about", (0.58, 0.48)),
}
W, H = OUT
GOLD = (220, 162, 96)
STEEL = (187, 210, 223)

def fade(y, start=.49, strength=190, power=1.6):
    t = max(0, min(1, (y / H - start) / (1-start)))
    return int(strength * t ** power)

def grade(src, focus):
    base = ImageOps.fit(src.convert("RGB"), OUT, method=Image.Resampling.LANCZOS, centering=focus)
    base = ImageEnhance.Contrast(base).enhance(1.13)
    base = ImageEnhance.Color(base).enhance(.89)
    base = ImageEnhance.Sharpness(base).enhance(1.12)
    # Fine-grain detail survives 2K exports without overwriting the photograph.
    noise = Image.effect_noise(OUT, 9).convert("RGB")
    base = Image.blend(base, noise, .022)
    return base

def treatment(base, kind, index):
    surface = base.convert("RGBA")
    if kind == "hero":
        # Keep this hero composition recognizable; its separate WebGL light layer is preserved.
        bottom_start, bottom_strength = .78, 44
    elif kind == "about":
        bottom_start, bottom_strength = .68, 78
    else:
        bottom_start, bottom_strength = .42, 205
    # Editorial black-on-black gradient holds the HTML caption legibly.
    ramp = Image.new("RGBA", (1, H))
    ramp.putdata([(2, 4, 7, fade(y, bottom_start, bottom_strength)) for y in range(H)])
    surface.alpha_composite(ramp.resize(OUT))
    # Nonuniform graphite vignette and subtle studio floor shading.
    mask = Image.new("L", OUT, 255)
    m = ImageDraw.Draw(mask)
    m.ellipse((-180, -230, W+110, H+320), fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(220))
    vignette = Image.new("RGBA", OUT, (1, 3, 6, 0))
    vignette.putalpha(mask.point(lambda p: int(p * .46)))
    surface.alpha_composite(vignette)

    overlay = Image.new("RGBA", OUT, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    if kind != "hero":
        # Extremely understated matte foil crop marks, not on-image text.
        d.line([(58, 66), (168, 66)], fill=GOLD + (87,), width=2)
        d.line([(58, 66), (58, 146)], fill=GOLD + (87,), width=2)
        d.line([(W-58, H-76), (W-158, H-76)], fill=STEEL + (62,), width=2)
        d.line([(W-58, H-76), (W-58, H-160)], fill=STEEL + (62,), width=2)
        d.line([(58, H-69), (192, H-69)], fill=GOLD + (63,), width=2)
        d.ellipse((W-112, 58, W-61, 109), outline=STEEL + (53,), width=2)
        d.arc((W-104, 66, W-69, 101), 300, 82, fill=GOLD + (112,), width=2)

    if kind in {"scan", "digital"}:
        # Microtechnical wire marks on the background, soft enough not to confuse the imagery.
        for i in range(1, 14):
            x = int(W * (.42 + i * .042))
            d.line([(x, int(.14 * H)), (x, int(.49 * H))], fill=STEEL + (15,), width=1)
        for j in range(7):
            y=int(H*(.18+j*.047))
            d.line([(int(W*.42),y),(int(W*.98),y)], fill=STEEL+(14,),width=1)
    if kind in {"portrait", "poster", "about"}:
        for r in [275, 380, 500]:
            d.arc((W*.58-r,H*.41-r,W*.58+r,H*.41+r),195,322,fill=GOLD+(24,),width=2)
    if kind in {"architecture", "worlds", "film"}:
        d.line([(W*.62,H*.27),(W*.95,H*.27)],fill=STEEL+(31,),width=2)
        d.ellipse((int(W*.78)-11,int(H*.27)-11,int(W*.78)+11,int(H*.27)+11),outline=GOLD+(55,),width=2)
    surface.alpha_composite(overlay)
    return surface.convert("RGB")

def generate():
    for i, (filename, (kind, focus)) in enumerate(ARTWORK.items(), 1):
        path = ROOT / filename
        if not path.is_file():
            raise FileNotFoundError(path)
        with Image.open(path) as original:
            image = treatment(grade(original, focus), kind, i)
        # Modern WebP with high fidelity; no fake "native 2K" claim.
        image.save(path, format="WEBP", quality=92, method=6)
        with Image.open(path) as check:
            assert check.size == OUT, (filename, check.size)
        print(f"{i:02d}/11 · 2048×1152 · {path.name} · {path.stat().st_size//1024} KiB")

if __name__ == "__main__":
    generate()
