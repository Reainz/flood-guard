from pathlib import Path
import shutil

from backend.proof.storage import PhotoUpload, cleanup_old_reports, persist_photos


def workspace_dir(name: str) -> Path:
    path = Path("test-artifacts") / name
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True)
    return path


def test_persist_photos_writes_files_and_metadata():
    upload_root = workspace_dir("photo-storage")
    photos = [
        PhotoUpload(filename="before.jpg", content=b"before", content_type="image/jpeg", photo_type="before"),
        PhotoUpload(filename="after.png", content=b"after", content_type="image/png", photo_type="after"),
    ]

    metadata = persist_photos(report_id="FG-AG-TEST-20260502000000", photos=photos, upload_root=upload_root)

    assert len(metadata) == 2
    assert (upload_root / "FG-AG-TEST-20260502000000" / "01-before.jpg").exists()
    assert metadata[0].sha256
    assert metadata[0].gps_source == "browser"


def test_cleanup_old_reports_dry_run_does_not_delete():
    upload_root = workspace_dir("cleanup")
    report_dir = upload_root / "old-report"
    report_dir.mkdir()

    result = cleanup_old_reports(upload_root=upload_root, max_age_days=90, dry_run=True, now_timestamp=2000000000)

    assert result["dry_run"] is True
    assert report_dir.exists()
    assert str(report_dir) in result["candidates"]
