from fastapi import FastAPI

app = FastAPI(title="Pale Blue Code API")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
