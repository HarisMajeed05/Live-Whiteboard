"""
app/ws/manager.py
===================
Tracks which WebSocket connections belong to which board (a "room"), and
handles broadcasting messages to everyone else in that room. One board can
have many simultaneous connections, one per browser tab that has it open.
"""

import json
from fastapi import WebSocket

CURSOR_COLORS = [
    "#3ee8dc", "#8b7bf7", "#ff8a8a", "#ffcf6b", "#4ade80",
    "#60a5fa", "#f472b6", "#fb923c", "#a3e635", "#22d3ee",
]


class ConnectionManager:
    def __init__(self):
        # board_id -> {websocket: {"user_id":..., "name":..., "color":...}}
        self.rooms: dict[str, dict[WebSocket, dict]] = {}

    def _assign_color(self, board_id: str) -> str:
        taken = {info["color"] for info in self.rooms.get(board_id, {}).values()}
        for color in CURSOR_COLORS:
            if color not in taken:
                return color
        # More users than colors in the palette, just cycle
        return CURSOR_COLORS[len(self.rooms.get(board_id, {})) % len(CURSOR_COLORS)]

    async def connect(self, board_id: str, websocket: WebSocket, user_id: str, name: str) -> dict:
        await websocket.accept()
        self.rooms.setdefault(board_id, {})
        color = self._assign_color(board_id)
        self.rooms[board_id][websocket] = {"user_id": user_id, "name": name, "color": color}
        return {"user_id": user_id, "name": name, "color": color}

    def disconnect(self, board_id: str, websocket: WebSocket):
        room = self.rooms.get(board_id)
        if not room:
            return None
        info = room.pop(websocket, None)
        if not room:
            self.rooms.pop(board_id, None)
        return info

    def active_users(self, board_id: str) -> list[dict]:
        return list(self.rooms.get(board_id, {}).values())

    async def broadcast(self, board_id: str, message: dict, exclude: WebSocket | None = None):
        room = self.rooms.get(board_id, {})
        payload = json.dumps(message)
        dead = []
        for ws in room:
            if ws is exclude:
                continue
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            room.pop(ws, None)


manager = ConnectionManager()
