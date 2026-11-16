"""
Build anonymised portfolio media from private source files.

  python scripts/build-media.py

Reads   private/projects.json          (private: source paths + client-name blocklist)
Writes  public/media/<slug>/*.webp     (re-encoded, metadata stripped, neutral names)
        src/data/projects.generated.json (public copy only: no source paths, no blocklist)

Privacy guarantees enforced here:
  * PDF renders are extracted as the embedded raster only, so the vector title block
    (client name, address, staff names, employer stamp) is never copied.
  * Drawings that must be rasterised are first redacted for every blocklist term, then
    clipped above the title block, then re-checked: any surviving term aborts the build.
  * Photos are re-encoded from pixels only (EXIF/GPS dropped), optionally cropped.
  * Output file names are <index>-<width>.webp; nothing from the source name survives.
"""
from __future__ import annotations

import base64
import io
import json
import shutil
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "private" / "projects.json"
OUT_MEDIA = ROOT / "public" / "media"
OUT_JSON = ROOT / "src" / "data" / "projects.generated.json"
WIDTHS = (640, 1280, 1920)
QUALITY = 82
RASTER_TARGET_WIDTH = 2400


def fail(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def embedded_image(pdf: Path, page_no: int) -> Image.Image:
    doc = pymupdf.open(pdf)
    page = doc[page_no - 1]
    imgs = sorted(page.get_images(full=True), key=lambda x: -x[2] * x[3])
    if not imgs:
        fail(f"no embedded image on page {page_no} of {pdf.name}")
    data = doc.extract_image(imgs[0][0])
    return Image.open(io.BytesIO(data["image"])).convert("RGB")


def raster_drawing(pdf: Path, page_no: int, clip: list[float], blocklist: list[str]) -> Image.Image:
    doc = pymupdf.open(pdf)
    page = doc[page_no - 1]
    for term in blocklist:
        for rect in page.search_for(term):  # case-insensitive
            page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)

    r = page.rect
    box = pymupdf.Rect(r.x0 + clip[0] * r.width, r.y0 + clip[1] * r.height,
                       r.x0 + clip[2] * r.width, r.y0 + clip[3] * r.height)
    leftover = page.get_text(clip=box).lower()
    hits = [t for t in blocklist if t.lower() in leftover]
    if hits:
        fail(f"blocklisted text still visible in {pdf.name} p{page_no}: {hits}")

    zoom = RASTER_TARGET_WIDTH / box.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=box, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def photo(path: Path) -> Image.Image:
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)  # bake orientation, then drop all metadata
    return im.convert("RGB")


def video_frame(path: Path, t: float) -> Image.Image:
    import cv2  # optional dependency: pip install opencv-python-headless

    cap = cv2.VideoCapture(str(path))
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, frame = cap.read()
    cap.release()
    if not ok:
        fail(f"cannot read frame at {t}s from {path.name}")
    return Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))  # pixels only, no container metadata


def crop_frac(im: Image.Image, c: list[float] | None) -> Image.Image:
    if not c:
        return im
    w, h = im.size
    return im.crop((round(c[0] * w), round(c[1] * h), round(c[2] * w), round(c[3] * h)))


def fit_into(im: Image.Image, w: int, h: int, mode: str) -> Image.Image:
    """cover: centre-crop to the box aspect then resize; contain: resize to fit inside."""
    if mode == "contain":
        c = im.copy()
        c.thumbnail((w, h), Image.LANCZOS)
        return c
    r = w / h
    iw, ih = im.size
    if iw / ih > r:
        nw = round(ih * r)
        im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else:
        nh = round(iw / r)
        im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def compose(spec: dict, built: dict[str, Image.Image]) -> Image.Image:
    """Lay out cells cut from this project's already-extracted images (board / drawing sheet)."""
    W, H = spec["size"]
    canvas = Image.new("RGB", (W, H), spec.get("bg", "#ffffff"))
    for cell in spec["cells"]:
        if cell["ref"] not in built:
            fail(f"compose: ref '{cell['ref']}' must be listed before the composite")
        src = crop_frac(built[cell["ref"]], cell.get("crop"))
        x, y, w, h = cell["box"]
        piece = fit_into(src, w, h, cell.get("fit", "cover"))
        canvas.paste(piece, (x + (w - piece.width) // 2, y + (h - piece.height) // 2))
    for line in spec.get("rules", []):  # hairlines, [x0, y0, x1, y1]
        ImageDraw.Draw(canvas).line(line, fill=spec.get("rule", "#cfc6b6"), width=2)
    return canvas


def placeholder(im: Image.Image) -> str:
    t = im.copy()
    t.thumbnail((24, 24))
    buf = io.BytesIO()
    t.save(buf, "WEBP", quality=40)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def write_variants(im: Image.Image, out_dir: Path, stem: str, url_base: str) -> dict:
    w0, h0 = im.size
    widths = sorted({min(w, w0) for w in WIDTHS})
    srcset = []
    for w in widths:
        h = round(h0 * w / w0)
        v = im if w == w0 else im.resize((w, h), Image.LANCZOS)
        name = f"{stem}-{w}.webp"
        v.save(out_dir / name, "WEBP", quality=QUALITY, method=6)  # no exif/icc passed
        srcset.append(f"{url_base}/{name} {w}w")
    return {
        "src": f"{url_base}/{stem}-{widths[-1]}.webp",
        "srcset": ", ".join(srcset),
        "w": w0,
        "h": h0,
        "placeholder": placeholder(im),
    }


def main() -> None:
    cfg = json.loads(MANIFEST.read_text(encoding="utf-8"))
    src_root = ROOT / cfg["sourceRoot"]
    blocklist: list[str] = cfg["blocklist"]

    OUT_MEDIA.mkdir(parents=True, exist_ok=True)
    for child in OUT_MEDIA.iterdir():  # clear contents, keep the folder (Windows dir locks)
        shutil.rmtree(child) if child.is_dir() else child.unlink()

    used_folders: set[str] = set()
    public_projects = []

    for p in cfg["projects"]:
        slug = p["slug"]
        out_dir = OUT_MEDIA / slug
        out_dir.mkdir()
        url_base = f"media/{slug}"
        images = {}
        built: dict[str, Image.Image] = {}
        for i, spec in enumerate(p["images"], start=1):
            rel = spec.get("photo") or spec.get("pdf") or spec.get("video")
            if rel:
                used_folders.add(Path(rel).parts[0])
                path = src_root / rel
                if not path.exists():
                    fail(f"missing source: {rel}")
            if "compose" in spec:
                im = compose(spec["compose"], built)
            elif "photo" in spec:
                im = photo(path)
            elif "video" in spec:
                im = video_frame(path, spec["t"])
            elif spec.get("raster"):
                im = raster_drawing(path, spec["page"], spec["clip"], blocklist + spec.get("redact", []))
            else:
                im = embedded_image(path, spec["page"])
            im = crop_frac(im, spec.get("crop"))
            for box in spec.get("whiteout", []):  # pixel mask for outlined text search can't find
                w, h = im.size
                ImageDraw.Draw(im).rectangle(
                    (round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h)), fill="white")
            built[spec["id"]] = im
            meta = write_variants(im, out_dir, f"{i:02d}", url_base)
            images[spec["id"]] = {"id": spec["id"], "tag": spec["tag"], "alt": spec["alt"], **meta}
            print(f"  {slug}/{i:02d}  {spec['tag']:8s} {meta['w']}x{meta['h']}")

        pub = {k: v for k, v in p.items() if k not in ("images",)}
        pub["images"] = list(images.values())
        if pub["cover"] not in images:
            fail(f"{slug}: cover '{pub['cover']}' not in images")
        public_projects.append(pub)

    text = json.dumps(public_projects, ensure_ascii=False, indent=2)
    low = text.lower()
    leaked = [t for t in blocklist if t.lower() in low]
    if leaked:
        fail(f"blocklisted terms in public JSON: {leaked}")
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(text, encoding="utf-8")

    all_folders = {d.name for d in src_root.iterdir() if d.is_dir()}
    unmapped = sorted(all_folders - used_folders)
    print(f"\n{len(public_projects)} projects -> {OUT_JSON.relative_to(ROOT)}")
    if unmapped:
        print("UNMAPPED source folders (add them to private/projects.json):")
        for u in unmapped:
            print("  -", u)


if __name__ == "__main__":
    main()
