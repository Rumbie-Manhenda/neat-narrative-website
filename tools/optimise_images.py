#!/usr/bin/env python3
"""Neat Narrative Co. — image build tool.

Re-encodes the photography in ``assets/images`` into web-optimised WebP, emits a
smaller ``@800`` variant of each photograph for ``srcset``, and generates the
favicon / touch-icon / Open Graph images.

Run from the project root:

    python tools/optimise_images.py

Originals are copied to ``assets/images/_originals`` the first time they are
processed, so the tool is safe to re-run after adding new photographs.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "assets" / "images"
BRAND = IMAGES / "brand"
SERVICES = IMAGES / "services"
GALLERY = IMAGES / "gallery"
BACKUP = IMAGES / "_originals"

PHOTO_WIDTHS = {
    "hero-home": 2200,
    "hero-cleaning-team": 2000,
    "why-choose": 1800,
    "values-window-clean": 1600,
    "areas-covered": 1600,
    "boardroom-meeting": 1600,
    "team-meeting": 1600,
    "office-cleaning": 1600,
    "about-us": 1600,
    "contact-desk": 1400,
    "brand-ambassadors": 1400,
}
DEFAULT_PHOTO_WIDTH = 1400
VARIANT_WIDTH = 800
ICON_PREFIX = "icon-"
PHOTO_QUALITY = 84
VARIANT_QUALITY = 78

NAVY = (10, 20, 36)
GOLD = (201, 164, 76)

SOURCE_SUFFIXES = {".webp", ".jpg", ".jpeg", ".png"}

try:  # Pillow >= 9.1
    RESAMPLE = Image.Resampling.LANCZOS
except AttributeError:  # pragma: no cover - older Pillow
    RESAMPLE = Image.LANCZOS


def is_icon(path: Path) -> bool:
    return path.stem.startswith(ICON_PREFIX)


def is_variant(path: Path) -> bool:
    return path.stem.endswith("@800")


def max_width_for(path: Path) -> int:
    return PHOTO_WIDTHS.get(path.stem, DEFAULT_PHOTO_WIDTH)


def flatten(im: Image.Image) -> Image.Image:
    """Composite any alpha onto the brand navy so photos never show seams."""
    if im.mode in ("RGBA", "LA", "P"):
        rgba = im.convert("RGBA")
        canvas = Image.new("RGBA", rgba.size, NAVY + (255,))
        canvas.alpha_composite(rgba)
        return canvas.convert("RGB")
    return im.convert("RGB")


def shrink(im: Image.Image, max_width: int) -> Image.Image:
    if im.width <= max_width:
        return im
    height = max(1, round(im.height * (max_width / im.width)))
    return im.resize((max_width, height), RESAMPLE)


def write_webp(im: Image.Image, dest: Path, quality: int) -> int:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=quality, method=6)
    return dest.stat().st_size


def backup_once(path: Path) -> None:
    destination = BACKUP / path.relative_to(IMAGES)
    if destination.exists():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)


def process_photo(path: Path) -> list[tuple[str, int, int, int]]:
    """Return (name, width, height, bytes) rows for the optimised outputs."""
    original = Image.open(path)
    original.load()
    backup_once(path)

    rows: list[tuple[str, int, int, int]] = []

    if is_icon(path):
        icon = original.convert("RGBA")
        size = write_webp(icon, path, 92)
        rows.append((path.name, icon.width, icon.height, size))
        return rows

    photo = flatten(original)
    full = shrink(photo, max_width_for(path))
    size = write_webp(full, path, PHOTO_QUALITY)
    rows.append((path.name, full.width, full.height, size))

    if full.width > VARIANT_WIDTH:
        small = shrink(photo, VARIANT_WIDTH)
        variant = path.with_name(f"{path.stem}@{VARIANT_WIDTH}.webp")
        variant_size = write_webp(small, variant, VARIANT_QUALITY)
        rows.append((variant.name, small.width, small.height, variant_size))

    return rows


def collect_sources() -> list[Path]:
    sources: list[Path] = []
    for folder in (BRAND, SERVICES, GALLERY):
        if not folder.is_dir():
            continue
        for path in sorted(folder.iterdir()):
            if path.is_file() and path.suffix.lower() in SOURCE_SUFFIXES and not is_variant(path):
                sources.append(path)
    return sources


def convert_non_webp(sources: list[Path]) -> None:
    """A .jpg source becomes a .webp sibling; the .jpg is removed afterwards."""
    for path in sources:
        if path.suffix.lower() == ".webp":
            continue
        target = path.with_suffix(".webp")
        if target.exists():
            path.unlink()
            continue
        path.rename(target)


def build_open_graph() -> tuple[str, int] | None:
    source = BRAND / "hero-cleaning-team.webp"
    if not source.exists():
        return None
    photo = flatten(Image.open(source)).resize((1200, 630), RESAMPLE)
    canvas = Image.new("RGB", (1200, 630), NAVY)
    canvas.paste(photo, (0, 0))
    dest = IMAGES / "og-neat-narrative.jpg"
    canvas.save(dest, "JPEG", quality=86, optimize=True, progressive=True)
    return dest.name, dest.stat().st_size


def draw_monogram(size: int) -> Image.Image:
    """Navy roundel with a gold 'N' drawn from strokes (no font dependency)."""
    scale = 8
    big = size * scale
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    inset = round(big * 0.04)
    draw.rounded_rectangle(
        (inset, inset, big - inset, big - inset),
        radius=round(big * 0.22),
        fill=NAVY + (255,),
        outline=GOLD + (255,),
        width=max(1, round(big * 0.035)),
    )
    pad = round(big * 0.31)
    left = pad
    right = big - pad
    top = pad
    bottom = big - pad
    stroke = max(2, round(big * 0.115))
    draw.line([(left, bottom), (left, top)], fill=GOLD + (255,), width=stroke)
    draw.line([(right, bottom), (right, top)], fill=GOLD + (255,), width=stroke)
    draw.line([(left, top), (right, bottom)], fill=GOLD + (255,), width=stroke)
    return im.resize((size, size), RESAMPLE)


def build_icons() -> list[tuple[str, int]]:
    rows: list[tuple[str, int]] = []
    master = draw_monogram(512)

    for size in (32, 180, 192, 512):
        name = f"apple-touch-icon.png" if size == 180 else f"icon-{size}.png"
        dest = IMAGES / name
        master.resize((size, size), RESAMPLE).save(dest, "PNG", optimize=True)
        rows.append((name, dest.stat().st_size))

    ico = ROOT / "favicon.ico"
    master.resize((256, 256), RESAMPLE).save(
        ico, sizes=[(16, 16), (32, 32), (48, 48)]
    )
    rows.append(("favicon.ico", ico.stat().st_size))
    return rows


def main() -> int:
    sources = collect_sources()
    convert_non_webp(sources)
    sources = collect_sources()

    print(f"Optimising {len(sources)} image(s)\n")
    total = 0
    rows: list[tuple[str, int, int, int]] = []
    for path in sources:
        rows.extend(process_photo(path))

    width = max((len(r[0]) for r in rows), default=10)
    for name, w, h, size in rows:
        total += size
        print(f"  {name:<{width}}  {w:>5}x{h:<5}  {size / 1024:>8.1f} KB")
    print(f"\n  assets total: {total / 1024 / 1024:.2f} MB")

    og = build_open_graph()
    if og:
        print(f"  open graph:   {og[0]} ({og[1] / 1024:.1f} KB)")
    for name, size in build_icons():
        print(f"  icon:         {name} ({size / 1024:.1f} KB)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
