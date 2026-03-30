import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="Greater Amman Municipality - Building Permits API",
    description="API for managing building permit applications, document processing, and checklist validation.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "GAM Permits API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
