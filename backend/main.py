from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import planets, lightcurves, bls, hunt, monotransit


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
app.include_router(lightcurves.router, prefix="/api")
app.include_router(bls.router, prefix="/api")
app.include_router(hunt.router, prefix="/api")
app.include_router(monotransit.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
