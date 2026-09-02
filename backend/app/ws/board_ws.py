"""
app/ws/board_ws.py
====================
One WebSocket connection per browser tab that has a board open. Handles:

- Broadcasting drawn elements to every other tab in the same board in real
  time, and persisting them to MongoDB so the board is still there next
  time anyone opens it.
- Broadcasting live cursor positions, these are NOT persisted, purely
  ephemeral, there's no reason to store where someone's mouse was.
- Tracking who's currently active in a board and telling everyone when
  someone joins or leaves.

SYNC MODEL, worth being explicit about: each drawn element (a stroke, a
shape, a text box) has its own id and is stored as its own document. Edits
to two different elements never conflict with each other at all, they're
just two separate database writes. Two people editing the EXACT same
element at the exact same instant is resolved last-write-wins, whichever
edit's database write lands last simply overwrites the other. That's a
real, known limitation, not a bug, true conflict-free merging of concurrent
edits to the same object is a genuinely hard problem (this is what
CRDTs / operational transforms solve), out of scope for a first version.
In practice this rarely matters for a whiteboard, since two people drawing
literally the same shape at the same instant is an edge case, not the
common flow.

Undo/redo is intentionally NOT handled here at all, it's implemented
entirely client-side as an inverse-operation stack (undoing an add sends a
delete, undoing a delete resends the add, undoing a modify resends the
previous state), so from this server's point of view, undo/redo just looks
like normal element_add/update/delete messages, no special handling needed.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from bson import ObjectId
import json

from app.core.security import decode_token, get_user_by_id
from app.db.mongodb import elements_collection, boards_collection
from app.ws.manager import manager

router = APIRouter()


@router.websocket("/ws/board/{board_id}")
async def board_websocket(websocket: WebSocket, board_id: str, token: str = Query(...)):
    user_id = decode_token(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    user = await get_user_by_id(user_id)
    if not user:
        await websocket.close(code=4001)
        return

    try:
        board_exists = await boards_collection.find_one({"_id": ObjectId(board_id)})
    except Exception:
        board_exists = None
    if not board_exists:
        await websocket.close(code=4004)
        return

    my_info = await manager.connect(board_id, websocket, user_id, user["name"])

    # Tell the newly connected client who else is already here, and tell
    # everyone else that this person just joined.
    await websocket.send_text(json.dumps({
        "type": "active_users",
        "users": manager.active_users(board_id),
    }))
    await manager.broadcast(board_id, {"type": "user_joined", "user": my_info}, exclude=websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = message.get("type")

            if msg_type == "cursor_move":
                await manager.broadcast(board_id, {
                    "type": "cursor_move",
                    "user_id": user_id,
                    "name": my_info["name"],
                    "color": my_info["color"],
                    "x": message.get("x"),
                    "y": message.get("y"),
                }, exclude=websocket)

            elif msg_type == "element_add" or msg_type == "element_update":
                element = message.get("element", {})
                element_id = element.get("id")
                if not element_id:
                    continue

                now = datetime.now(timezone.utc)
                update_doc = {
                    "board_id": board_id,
                    "element_id": element_id,
                    "type": element.get("type"),
                    "data": element.get("data"),
                    "color": element.get("color"),
                    "stroke_width": element.get("stroke_width", 3),
                    "created_by": user_id,
                    "updated_at": now,
                    "deleted": False,
                }
                await elements_collection.update_one(
                    {"board_id": board_id, "element_id": element_id},
                    {"$set": update_doc, "$setOnInsert": {"created_at": now}},
                    upsert=True,
                )
                await boards_collection.update_one(
                    {"_id": ObjectId(board_id)}, {"$set": {"updated_at": now}}
                )
                await manager.broadcast(board_id, {
                    "type": msg_type,
                    "element": element,
                }, exclude=websocket)

            elif msg_type == "element_delete":
                element_id = message.get("element_id")
                if not element_id:
                    continue
                await elements_collection.update_one(
                    {"board_id": board_id, "element_id": element_id},
                    {"$set": {"deleted": True, "updated_at": datetime.now(timezone.utc)}},
                )
                await manager.broadcast(board_id, {
                    "type": "element_delete",
                    "element_id": element_id,
                }, exclude=websocket)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(board_id, websocket)
        await manager.broadcast(board_id, {"type": "user_left", "user_id": user_id})
