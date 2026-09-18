# ExpireX backend

This FastAPI service exposes the existing ExpireX CSV pipeline outputs. It does
not recreate or modify the original detection, routing, scoring, allocation, or
Monte Carlo algorithms.

## Windows setup

From PowerShell:

```powershell
cd C:\Expirex
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r .\backend\requirements.txt
```

If PowerShell blocks activation, run this once for the current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

The service reads the repository-relative `datasets` directory by default. To
use another dataset directory, set `EXPIREX_DATASETS_DIR` before starting the
server. Production CORS origins can be configured with the comma-separated
`CORS_ORIGINS` environment variable.

## Run

```powershell
cd C:\Expirex
.\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --reload --port 8011
```

For a production-style process, bind to all interfaces and use the hosting
platform's `PORT` value:

```powershell
python -m uvicorn backend.main:app --host 0.0.0.0 --port $env:PORT
```

Open Swagger locally at <http://localhost:8011/docs>.

## Test

```powershell
cd C:\Expirex
.\.venv\Scripts\Activate.ps1
python -m pytest backend\tests -q
```
