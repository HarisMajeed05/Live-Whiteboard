from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends

from app.models.schemas import BoardCreate
from app.db.mongodb import boards_collection, elements_collection
from app.core.security import get_current_user

router = APIRouter(prefix="/api/boards", tags=["boards"])


@router.post("")
async def create_board(payload: BoardCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "name": payload.name,
        "owner_id": current_user["id"],
        "created_at": datetime.now(timezone.utc),
    }
    result = await boards_collection.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("")
async def list_my_boards(current_user: dict = Depends(get_current_user)):
    cursor = boards_collection.find({"owner_id": current_user["id"]}).sort("created_at", -1)
    boards = await cursor.to_list(length=200)
    for b in boards:
        b["id"] = str(b.pop("_id"))
    return boards


@router.get("/{board_id}")
async def get_board(board_id: str, current_user: dict = Depends(get_current_user)):
    """Any authenticated user can open a board if they have its id, that's
    the "join by link" model, there's no separate invite/membership system
    in this first version, the board id itself is the access control."""
    try:
        board = await boards_collection.find_one({"_id": ObjectId(board_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Board not found")
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    board["id"] = str(board.pop("_id"))
    return board


@router.get("/{board_id}/elements")
async def get_board_elements(board_id: str, current_user: dict = Depends(get_current_user)):
    cursor = elements_collection.find({"board_id": board_id, "deleted": False}).sort("created_at", 1)
    elements = await cursor.to_list(length=20000)
    for e in elements:
        e["_id"] = str(e["_id"])
    return elements


@router.delete("/{board_id}")
async def delete_board(board_id: str, current_user: dict = Depends(get_current_user)):
    board = await boards_collection.find_one({"_id": ObjectId(board_id)})
    if not board or board["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Board not found")
    await boards_collection.delete_one({"_id": ObjectId(board_id)})
    await elements_collection.delete_many({"board_id": board_id})
    return {"deleted": True}
