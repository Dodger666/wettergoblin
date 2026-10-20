#!/usr/bin/env python3
"""RollHero FastAPI app.

Exposes the rollhero character generator over HTTP and runs the Discord bot as
a *separate process* managed by the app's lifespan. The bot therefore runs
independently of the web server (its own process, own crash domain) while still
being started and stopped together with the API.

Run
---
    uvicorn app:app --host 0.0.0.0 --port 8000

or simply:

    python app.py

Endpoints
---------
    GET /                 -> basic service info
    GET /health           -> API + bot-process status
    GET /rollhero?params= -> generated character sheet as a downloadable .txt

IMPORTANT: run with a SINGLE worker. Each uvicorn worker would spawn its own
bot process, and Discord does not allow the same token to be connected twice.
"""

import multiprocessing
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse, Response

from bot import build_filename, run_bot_process
from rollhero import Character

# Holds the handle to the separately-spawned Discord bot process.
_bot_process: "multiprocessing.process.BaseProcess | None" = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the Discord bot in its own process on startup; stop it on shutdown."""
    global _bot_process

    # "spawn" gives a clean, fully re-imported child process (default on macOS
    # and Windows); we request it explicitly so behaviour is identical on Linux.
    ctx = multiprocessing.get_context("spawn")
    _bot_process = ctx.Process(
        target=run_bot_process,
        name="rollhero-discord-bot",
        daemon=True,
    )
    _bot_process.start()

    try:
        yield
    finally:
        if _bot_process is not None and _bot_process.is_alive():
            _bot_process.terminate()
            _bot_process.join(timeout=10)
            if _bot_process.is_alive():  # last resort if it ignored terminate
                _bot_process.kill()
                _bot_process.join(timeout=5)


app = FastAPI(
    title="RollHero API",
    description="AD&D 1e-style character generator, with the Discord bot "
    "running as a separate process.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
def root():
    return {
        "service": "RollHero API",
        "endpoints": ["/health", "/rollhero?params=fighter+elf+xp12000"],
    }


@app.get("/health")
def health():
    alive = _bot_process.is_alive() if _bot_process is not None else False
    pid = _bot_process.pid if _bot_process is not None else None
    return JSONResponse(
        {
            "status": "ok",
            "bot_process_alive": alive,
            "bot_process_pid": pid,
        }
    )


@app.get("/rollhero")
def rollhero(
    params: str = Query(
        "",
        description='rollhero params, e.g. "fighter elf xp12000" or '
        '"fighter|thief elf xp40000 name=Bob"',
    ),
):
    """Generate a character sheet and return it as a downloadable text file."""
    clean = (params or "").replace('"', "").strip()
    char = Character.generate(clean)
    sheet = char.to_text_sheet()
    filename = build_filename(char)

    return Response(
        content=sheet,
        media_type="text/plain; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def main():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)


if __name__ == "__main__":
    main()
