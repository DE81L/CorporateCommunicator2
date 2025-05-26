import asyncio
from fastapi import FastAPI, WebSocket
import uvicorn
import argparse

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            await ws.send_text(data)
    except Exception:
        pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simple Python WebSocket echo server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind")
    parser.add_argument("--port", type=int, default=8001, help="Port to bind")
    args = parser.parse_args()
    uvicorn.run(app, host=args.host, port=args.port)
