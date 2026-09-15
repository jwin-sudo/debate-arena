# Podium — Debate Arena

A full-stack debate discovery and voting experience built with **FastAPI** and **React**.

## Run locally

### API

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

The API and interactive documentation are available at `http://localhost:8000` and
`http://localhost:8000/docs`.

### Web app

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the FastAPI server.

## Tests

```bash
pytest
cd frontend && npm run build
```
