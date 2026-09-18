# ExpireX frontend

React/Vite foundation for the ExpireX logistics recovery control center.
The shell includes a reusable 3D particle and wireframe visual system.
Legacy product routes, auth, mock data, and API calls are intentionally excluded.

## Windows setup

From PowerShell:

```powershell
cd C:\Expirex\frontend
npm install
```

The backend URL is configured in [.env](./.env) and should be based on
[.env.example](./.env.example):

```text
VITE_API_URL=http://localhost:8011
```

## Run

Start the FastAPI backend first, then run the frontend:

```powershell
cd C:\Expirex\frontend
npm run dev
```

Open the URL shown by Vite, normally <http://localhost:5173>.

## Build

```powershell
cd C:\Expirex\frontend
npm run build
```
