import argparse
import asyncio
import json
import os
from typing import Dict, Set, List

import asyncpg
from fastapi import Body, FastAPI, WebSocket, WebSocketDisconnect
import uvicorn

# Map user_id -> set of WebSocket connections
connections: Dict[int, Set[WebSocket]] = {}

db_pool: asyncpg.Pool | None = None

async def init_db() -> None:
    global db_pool
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        return
    db_pool = await asyncpg.create_pool(dsn=db_url)

app = FastAPI()

@app.on_event("startup")
async def on_startup() -> None:
    await init_db()

@app.on_event("shutdown")
async def on_shutdown() -> None:
    if db_pool:
        await db_pool.close()

async def send_to_user(user_id: int, message: dict) -> bool:
    targets = connections.get(user_id)
    if not targets:
        return False
    data = json.dumps(message)
    to_remove = []
    for ws in targets:
        if ws.client_state.name == "CONNECTED":
            await ws.send_text(data)
        else:
            to_remove.append(ws)
    for ws in to_remove:
        targets.discard(ws)
    return True

async def broadcast_status(user_id: int, isonline: int) -> None:
    msg = json.dumps({"type": "user-status", "payload": {"userId": user_id, "isonline": isonline}})
    for sets in connections.values():
        for ws in sets:
            if ws.client_state.name == "CONNECTED":
                await ws.send_text(msg)

# ----- HTTP endpoints for server-side message delivery -----
@app.post("/chat")
async def post_chat(userId: int = Body(...), message: dict = Body(...)):
    ok = await send_to_user(userId, {"type": "chat", "payload": message})
    return {"delivered": ok}

@app.post("/group-chat")
async def post_group_chat(userIds: List[int] = Body(...), message: dict = Body(...)):
    delivered = []
    for uid in userIds:
        if await send_to_user(uid, {"type": "chat", "payload": message}):
            delivered.append(uid)
    return {"delivered": delivered}

async def update_online_status(user_id: int, isonline: int) -> None:
    """Update user's online status in the database if configured."""
    if not db_pool:
        return
    async with db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET isonline=$1 WHERE id=$2",
            isonline,
            user_id,
        )

async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    params = ws.query_params
    user_id_param = params.get("userId")
    if user_id_param is None:
        await ws.close(code=4401)
        return
    try:
        user_id = int(user_id_param)
    except ValueError:
        await ws.close(code=4401)
        return
    user_set = connections.setdefault(user_id, set())
    first = len(user_set) == 0
    user_set.add(ws)
    if first:
        await update_online_status(user_id, 1)
        await broadcast_status(user_id, 1)
    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                continue
            mtype = msg.get("type")
            payload = msg.get("payload", {})
            if mtype == "p2p-signal":
                to = payload.get("to")
                signal = payload.get("signal")
                await send_to_user(to, {"type": "p2p-signal", "payload": {"from": user_id, "signal": signal}})
            elif mtype == "call-request":
                to = payload.get("to")
                call_type = payload.get("callType")
                from_name = payload.get("fromName")
                await send_to_user(to, {"type": "call-request", "payload": {"from": user_id, "fromName": from_name, "callType": call_type}})
            elif mtype in ("call-accept", "call-reject"):
                to = payload.get("to")
                await send_to_user(to, {"type": mtype, "payload": {"from": user_id}})
            # ignore unknown types
    except WebSocketDisconnect:
        pass
    finally:
        user_set.discard(ws)
        last = len(user_set) == 0
        if last:
            connections.pop(user_id, None)
            await update_online_status(user_id, 0)
            await broadcast_status(user_id, 0)

@app.websocket("/ws")
async def ws_handler(websocket: WebSocket):
    await websocket_endpoint(websocket)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Python WebSocket server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind")
    parser.add_argument("--port", type=int, default=8001, help="Port to bind")
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=args.port)
