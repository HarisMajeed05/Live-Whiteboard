# Realtime Whiteboard

Multiple users draw on the same board at the same time, see each other's
cursors move live, and every board persists to MongoDB so it's exactly
where you left it next time anyone opens it.

React frontend with Fabric.js for the canvas, FastAPI backend with
WebSockets for real-time sync, JWT auth, MongoDB for storage.

## What this covers

- Persistent boards, saved to MongoDB, reopen anytime
- Multiple separate boards, create your own or join someone else's by ID
- Pen, eraser, rectangle, circle, line, text, undo/redo
- Live cursors, see everyone else's mouse position and name in real time

## Setup

### Backend
```bash
cd backend
conda env create -f environment.yml
conda activate whiteboard-backend
copy .env.example .env
```
Fill in `JWT_SECRET_KEY` in `.env`. Point `MONGODB_URI` at a local MongoDB
instance or an Atlas cluster, then:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5173`, sign up, create a board.

**To test real-time collaboration**, open the same board URL in two
different browser windows (or one normal, one incognito, so they're
different logged-in sessions), draw in one, watch it appear in the other.

## How the real-time sync actually works

Every drawn object (a pen stroke, a shape, a text box) gets its own id the
moment it's created and is broadcast to everyone else currently on that
board through a WebSocket, then persisted to MongoDB as its own document.

**Worth understanding precisely, this determines what this can and can't
handle:** editing two different objects never conflicts, they're just two
independent database writes. Two people editing the exact same object at
the exact same instant is resolved last-write-wins, whichever edit's
database write lands last simply overwrites the other. That's a real,
known limitation, not a bug. True conflict-free merging of concurrent edits
to the same object (what CRDTs and operational transforms solve) is a
genuinely hard, separate problem, out of scope for a first version, and
in practice rarely matters for a whiteboard since two people editing the
literal same shape at the literal same instant is an edge case, not the
common flow.

**Undo/redo** is entirely client-side and only affects your own actions,
not anyone else's. It works by keeping a personal stack of inverse
operations, undoing an "add" sends a delete, undoing a "delete" resends
the original data, undoing a "modify" resends the previous state. From the
backend's point of view, undo/redo looks exactly like normal drawing
messages, no special handling needed there at all.

**Live cursors** are broadcast over the WebSocket but never written to
MongoDB, there's no reason to persist where someone's mouse used to be.

## Known limitations, worth knowing before you rely on this

- **No zoom or pan yet.** The canvas is a fixed 1:1 view. Adding infinite
  canvas panning is a real feature to build later, not included here.
- **Eraser deletes whole objects, not partial strokes.** Clicking with the
  eraser tool removes an entire shape or stroke, it doesn't erase pixels
  within it. This is a deliberate simplification, a true "erase part of a
  stroke" tool needs path-splitting logic that's a meaningfully bigger
  feature on its own.
- **Same-object concurrent edits are last-write-wins**, as explained above.
- **Board access is "anyone with the ID"**, there's no separate
  invite/permission system yet, whoever has the board's id (from the
  dashboard, or shared via "Copy Board ID") can open and edit it. Good
  enough for a first version, worth adding real membership/roles if this
  needs to restrict who can access a given board.

## Project structure

```
whiteboard/
├── backend/
│   └── app/
│       ├── api/        auth, boards (create/list/get/delete)
│       ├── core/         config, security (JWT, shared by HTTP and WebSocket auth)
│       ├── db/             mongodb connection
│       ├── models/        pydantic schemas
│       ├── ws/              connection manager + the board websocket endpoint
│       └── main.py
└── frontend/
    └── src/
        ├── pages/          Login, Signup, Dashboard, Board
        ├── hooks/          useBoardSocket (the WebSocket client)
        ├── context/       AuthContext
        └── App.jsx
```
