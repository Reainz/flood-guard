from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
from pathlib import Path
import time

from backend.proof.models import PhotoMetadata

UPLOAD_ROOT = Path("uploads")
ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png"}
MAX_PHOTO_BYTES = 5 * 1024 * 1024


@dataclass(frozen=True)
class PhotoUpload:
    filename: str
    content: bytes
    content_type: str
    photo_type: str


def persist_photos(
    report_id: str,
    photos: list[PhotoUpload],
    upload_root: Path = UPLOAD_ROOT,
) -> list[PhotoMetadata]:
    if not 2 <= len(photos) <= 6:
        raise ValueError("MISSING_PHOTOS" if len(photos) < 2 else "TOO_MANY_PHOTOS")

    report_dir = upload_root / report_id
    report_dir.mkdir(parents=True, exist_ok=True)
    metadata = []
    for index, photo in enumerate(photos, start=1):
        _validate_photo(photo)
        suffix = ALLOWED_CONTENT_TYPES[photo.content_type]
        safe_name = _safe_filename(photo.filename, index, suffix)
        path = report_dir / safe_name
        path.write_bytes(photo.content)
        metadata.append(
            PhotoMetadata(
                filename=safe_name,
                photo_type=photo.photo_type,
                content_type=photo.content_type,
                size_bytes=len(photo.content),
                sha256=hashlib.sha256(photo.content).hexdigest(),
                timestamp=datetime.now(timezone.utc).isoformat(),
                gps_source="browser",
                path=str(path),
            )
        )
    return metadata


def cleanup_old_reports(
    upload_root: Path = UPLOAD_ROOT,
    max_age_days: int = 90,
    dry_run: bool = True,
    now_timestamp: float | None = None,
) -> dict:
    now = now_timestamp if now_timestamp is not None else time.time()
    cutoff_seconds = max_age_days * 24 * 60 * 60
    candidates = []
    if upload_root.exists():
        for child in upload_root.iterdir():
            if child.is_dir() and now - child.stat().st_mtime > cutoff_seconds:
                candidates.append(str(child))
    if not dry_run:
        for candidate in candidates:
            _remove_tree(Path(candidate))
    return {"dry_run": dry_run, "candidates": candidates, "deleted": [] if dry_run else candidates}


def _validate_photo(photo: PhotoUpload) -> None:
    if photo.content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("INVALID_PHOTO_TYPE")
    if len(photo.content) > MAX_PHOTO_BYTES:
        raise ValueError("PHOTO_TOO_LARGE")
    if not photo.content:
        raise ValueError("EMPTY_PHOTO")


def _safe_filename(filename: str, index: int, suffix: str) -> str:
    stem = Path(filename).stem or f"photo-{index}"
    safe = "".join(char if char.isalnum() or char in {"-", "_"} else "-" for char in stem).strip("-")
    return f"{index:02d}-{safe or 'photo'}{suffix}"


def _remove_tree(path: Path) -> None:
    for child in path.iterdir():
        if child.is_dir():
            _remove_tree(child)
        else:
            child.unlink()
    path.rmdir()
