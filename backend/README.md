# SmartDoc G5.3 – FastAPI Backend (Auth + Roles + Stubs)

Free local-first backend with JWT auth, simple roles, and stubbed analytics endpoints.

## Quickstart (local)

```bash
# Windows (PowerShell)
./run.ps1

# macOS/Linux
chmod +x run.sh && ./run.sh
```

Then open http://127.0.0.1:8000/docs

## Endpoints

- `POST /api/auth/register` — create user (role: `viewer|analyst|admin`)
- `POST /api/auth/login` — returns access token (Bearer)
- `GET  /api/auth/me` — current user info (protected)
- `GET  /api/users` — list users (admin-only)
- `POST /api/explore` — returns chart-ready data (stub)
- `POST /api/correlate` — returns correlation insights (stub)
- `GET  /api/health` — health check

## Configure

Copy `.env.example` → `.env` and adjust values (secret key, CORS).

## Render (free tier)

- **Service**: Python / FastAPI
- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Env**: set SECRET_KEY, CORS_ORIGINS, DATABASE_URL (e.g., SQLite file or free Postgres)

Vercel will host your frontend; point it to your Render URL in frontend `.env` as `VITE_API_URL`.
