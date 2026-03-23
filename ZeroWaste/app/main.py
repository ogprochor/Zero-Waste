from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException

from ZeroWaste.app.db.database import engine
from ZeroWaste.app.routers import categories, offers, users, auth
import ZeroWaste.app.routers.categories as categories_module

from ZeroWaste.app.routers import messages
from ZeroWaste.app.models.category import Category
from ZeroWaste.app.models.offer import Offer
from ZeroWaste.app.models.user import User


BASE_DIR = Path(__file__).resolve().parent.parent.parent
MEDIA_DIR = BASE_DIR / "media"
OFFERS_DIR = MEDIA_DIR / "offers"

STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"

MEDIA_DIR.mkdir(exist_ok=True)
OFFERS_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

app = FastAPI()

app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error"
        },
    )
@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/__debug")
def __debug():
    return {
        "file": __file__,
        "base_dir": str(BASE_DIR),
        "media_dir": str(MEDIA_DIR),
        "static_dir": str(STATIC_DIR),
        "uploads_dir": str(UPLOADS_DIR),
    }


@app.get("/__debug_categories")
def __debug_categories():
    return {
        "categories_router_file": categories_module.__file__,
    }


@app.get("/__debug_db")
def __debug_db():
    return {"db_url": str(engine.url)}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    print(" Aplikacja startuje...")


app.include_router(categories.router)
app.include_router(offers.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(messages.router, prefix="/messages", tags=["messages"])