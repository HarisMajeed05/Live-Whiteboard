# Live Whiteboard

A collaborative whiteboard. Several people draw on the same board at the same time and see each other's cursors move live. Every board is saved in MongoDB, so it is there when you come back.

Frontend: React with Fabric.js. Backend: FastAPI with WebSockets, JWT login and MongoDB.

## Features

- Sign up and log in
- Create your own boards or join someone else's with a board ID
- Pen, eraser, rectangle, circle, line and text
- Undo and redo
- Live cursors with names
- Boards are saved and reopen where you left them

## Setup

### Backend

```bash
cd backend
conda env create -f environment.yml
conda activate whiteboard-backend
copy .env.example .env
```

Set `JWT_SECRET_KEY` in `.env` and point `MONGODB_URI` at a local MongoDB or an Atlas cluster. Then start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173, sign up and create a board. To try the live sync, open the same board in two browser windows (one normal and one private) and draw in one.

## How it works

Each drawn object (a stroke, shape or text box) gets an ID when it is created. It is sent to everyone on the board through a WebSocket and saved in MongoDB as its own document.

- Editing two different objects never conflicts, because they are separate writes.
- If two people edit the same object at the same moment, the last write wins.
- Undo and redo run in the browser and only affect your own actions. To the backend they look like normal add, delete and modify messages.
- Cursor positions are sent over the WebSocket but are not saved.

## Limitations

- No zoom or pan. The canvas is a fixed view.
- The eraser removes whole objects, not parts of a stroke.
- Anyone with a board ID can open and edit that board. There are no invites or roles yet.

## Project structure

```
backend/
  app/
    api/       auth and board routes
    core/      config and JWT security
    db/        MongoDB connection
    models/    Pydantic schemas
    ws/        connection manager and board WebSocket
    main.py
frontend/
  src/
    api/       API client
    components/
    context/   AuthContext
    hooks/     useBoardSocket
    pages/     Landing, Login, Signup, Dashboard, Board
    App.jsx
```
