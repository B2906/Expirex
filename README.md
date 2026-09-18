# ExpireX

## Expiry-Aware Logistics Recovery Intelligence

ExpireX exposes the existing persisted logistics pipeline through a FastAPI
backend and a React/Vite operations interface. The application reads the
existing CSV outputs as its source of truth and does not regenerate datasets or
recreate the recovery algorithms.

## Architecture

```text
Detection results
      ↓
Recovery paths
      ↓
Auction / allocation
      ↓
Monte Carlo confidence
      ↓
Explainability
      ↓
FastAPI
      ↓
React
```

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- Leaflet / React Leaflet
- Three.js visual shell

### Backend

- FastAPI
- Pandas
- NumPy
- Uvicorn

### Data

Persisted logistics datasets in `datasets/`:

- Anomaly detection results
- Recovery path analysis
- Capacity-aware allocation results
- Monte Carlo confidence
- Explainability inputs
- Hub and route network data

## Features

- Anomaly detection results
- Recovery path analysis
- Capacity-aware allocation results
- Monte Carlo confidence
- Explainability
- Logistics Digital Twin
- Analytics

## Local development

### Backend

```powershell
cd C:\Expirex
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\backend\requirements.txt
python -m uvicorn backend.main:app --reload --port 8011
```

The backend uses the repository-relative `datasets/` directory by default.
Override it only when needed:

```powershell
$env:EXPIREX_DATASETS_DIR = "C:\path\to\datasets"
```

### Frontend

```powershell
cd C:\Expirex\frontend
npm install
npm run dev
```

The frontend API URL is configured through `VITE_API_URL`. Copy
`.env.example` to `.env` and adjust the value when the backend is hosted at a
different address:

```text
VITE_API_URL=http://localhost:8011
```

Open the frontend at <http://localhost:5173>.

Swagger is available at <http://localhost:8011/docs>.

## Deployment preparation

ExpireX is prepared for deployment but is not deployed by this repository.

### Frontend hosting

Build the static frontend bundle with:

```powershell
cd C:\Expirex\frontend
npm run build
```

Host the generated `frontend/dist/` directory on a static web host. Set
`VITE_API_URL` to the deployed backend URL before building; Vite embeds
`VITE_*` values into the browser bundle, so do not place secrets in them.

### Backend hosting

Install `backend/requirements.txt` and start Uvicorn with the platform port:

```text
python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

The deployment must include the repository `datasets/` directory, including
all required persisted CSV files. The `/health` endpoint is suitable for a
basic platform health check.

### Environment variables

- `VITE_API_URL`: frontend build-time URL for the FastAPI service.
- `EXPIREX_DATASETS_DIR`: optional backend override for the dataset directory.
- `CORS_ORIGINS`: optional comma-separated list of allowed frontend origins.

For local development, backend CORS defaults to:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

For deployment, set `CORS_ORIGINS` to the exact frontend origin or origins.
Do not use a wildcard when exposing the service publicly.

## Testing

Backend regression tests:

```powershell
cd C:\Expirex
.\.venv\Scripts\python.exe -m pytest backend\tests
```

Frontend production build:

```powershell
cd C:\Expirex\frontend
npm run build
```
