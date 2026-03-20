from fastapi import APIRouter, UploadFile, File, HTTPException,status
from pathlib import Path
import uuid

router = APIRouter(prefix="/uploads", tags=["uploads"])

# .../ZeroWaste/app/routers/uploads.py -> BASE_DIR = .../ZeroWaste/app
BASE_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BASE_DIR / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/gif"}

@router.post("")
async def upload_images(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(
            status_code= status.HTTP_400_BAD_REQUEST,
            detail="No files provided")

    urls: list[str] = []

    for f in files:
        if f.content_type not in ALLOWED:
            raise HTTPException(
                status_code= status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported type: {f.content_type}")

        suffix = Path(f.filename).suffix.lower() or ".jpg"
        name = f"{uuid.uuid4().hex}{suffix}"
        dst = UPLOAD_DIR / name

        content = await f.read()
        dst.write_bytes(content)

      
        urls.append(f"/static/uploads/{name}")

    return {"urls": urls}
