"""Create web-ready derivatives from the preserved Star Atlas reference library."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "assets" / "reference" / "star-atlas"
OUTPUT_ROOT = ROOT / "public" / "assets" / "star-atlas"
SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def save_webp(source: Path, destination: Path, max_size: tuple[int, int], quality: int) -> dict:
    with Image.open(source) as opened:
        frame = ImageOps.exif_transpose(opened.copy())
        if frame.mode not in ("RGB", "RGBA"):
            frame = frame.convert("RGBA" if "A" in frame.getbands() else "RGB")
        frame.thumbnail(max_size, Image.Resampling.LANCZOS)
        destination.parent.mkdir(parents=True, exist_ok=True)
        frame.save(destination, "WEBP", quality=quality, method=6)
        return {
            "width": frame.width,
            "height": frame.height,
            "aspectRatio": round(frame.width / frame.height, 4),
            "hasAlpha": frame.mode == "RGBA",
            "bytes": destination.stat().st_size,
        }


def main() -> None:
    manifest = json.loads((SOURCE_ROOT / "manifest.json").read_text(encoding="utf-8"))
    output_projects = []

    for project in manifest["projects"]:
        output_assets = []
        for index, relative_file in enumerate(project.get("files", []), start=1):
            source = SOURCE_ROOT / relative_file
            if source.suffix.lower() not in SUPPORTED:
                continue
            stem = f"{index:02d}-{source.stem.removeprefix(f'{index:02d}-')}"
            display = OUTPUT_ROOT / project["slug"] / f"{stem}.webp"
            thumb = OUTPUT_ROOT / project["slug"] / "thumbs" / f"{stem}.webp"
            try:
                display_meta = save_webp(source, display, (1600, 1600), 82)
                thumb_meta = save_webp(source, thumb, (480, 480), 76)
            except (OSError, ValueError):
                continue
            output_assets.append({
                "source": relative_file,
                "display": f"/assets/star-atlas/{project['slug']}/{display.name}",
                "thumbnail": f"/assets/star-atlas/{project['slug']}/thumbs/{thumb.name}",
                **display_meta,
                "thumbnailBytes": thumb_meta["bytes"],
            })
        output_projects.append({
            "slug": project["slug"],
            "title": project["title"],
            "sourceUrl": project["url"],
            "assets": output_assets,
        })

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    (OUTPUT_ROOT / "catalog.json").write_text(
        json.dumps({"projects": output_projects}, indent=2), encoding="utf-8"
    )
    print(json.dumps({
        "projects": len(output_projects),
        "displayAssets": sum(len(project["assets"]) for project in output_projects),
        "output": str(OUTPUT_ROOT),
    }))


if __name__ == "__main__":
    main()
