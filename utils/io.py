from fastapi import UploadFile, HTTPException
from pathlib import Path
import shutil

def stream_save_upload(file: UploadFile, upload_dir: Path) -> Path:
    dest = upload_dir / f"{file.filename}"
    try:
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload save failed: {str(e)}")
    finally:
        file.file.close()
    return dest