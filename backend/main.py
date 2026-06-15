from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import planets


@asynccontextmanager
async def lifespan(app: FastAPI):
    await planets.load_cache()
    yield


app = FastAPI(title="Pale Blue Code API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pale-blue-code.vercel.app",
        "http://localhost:5173",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(planets.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
