# Deployment guide

## Backend: Render (Flask)

1. Create a Render **Web Service** from this repository.
2. Set **Root Directory** to `server`.
3. Set the build command to `pip install -r requirements.txt`.
4. Set the start command to `gunicorn app:app`.
5. Add the environment variables below. Copy the generated `https://<service>.onrender.com` URL for the frontend configuration.
6. If the database has not yet been initialized, run `python init_db.py` once from a Render shell after setting `DATABASE_URL`.

## Frontend: Vercel (Vite)

1. Import this repository into Vercel.
2. Set **Root Directory** to `client`.
3. Set the build command to `npm install && npm run build` and the output directory to `dist`.
4. Set `VITE_API_URL` to the public Render backend URL, for example `https://your-api.onrender.com`. Do not include a trailing slash.
5. Deploy, then set the backend's `FRONTEND_URL` to the resulting Vercel URL (for example `https://your-app.vercel.app`) and redeploy the backend.

## Required environment variables

| Service | Variable | Value |
| --- | --- | --- |
| Render | `DATABASE_URL` | Neon pooled or direct PostgreSQL connection string with `sslmode=require` |
| Render | `SECRET_KEY` | A long random secret used to sign authentication tokens |
| Render | `GEMINI_API_KEY` | Gemini API key (required for image conversion and AI drill feedback) |
| Render | `FRONTEND_URL` | Exact Vercel deployment origin, without a trailing slash |
| Render | `PORT` | `5000` locally; Render supplies its own value in production |
| Render | `NODE_ENV` | `production` |
| Render | `INITIAL_SUPERADMIN_PASSWORD` | Strong one-time initial password; required only when running `init_db.py` on a new database |
| Vercel | `VITE_API_URL` | Public Render backend origin, without a trailing slash |

`SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are also needed only when blueprint image storage is enabled.

## Common issues

- **CORS or login cookie errors:** Confirm `FRONTEND_URL` exactly matches the deployed Vercel origin, including `https://`, and that `NODE_ENV=production` is set. Redeploy Render after changing it.
- **Requests still reach Vercel instead of the API:** Set `VITE_API_URL` in Vercel and redeploy; Vite variables are embedded at build time.
- **Neon connection failure:** Use the full Neon connection string and include `sslmode=require`. Confirm Neon allows connections from Render.
- **Render starts but cannot import the app:** Confirm Root Directory is `server` and Start Command is exactly `gunicorn app:app`.
- **Large upload rejected:** The backend intentionally limits request bodies to 10 MB.
- **Page refresh returns 404 on Vercel:** `client/vercel.json` contains the SPA rewrite; ensure it is deployed with the frontend.

## Post-deployment checklist

- [ ] Open the Vercel URL and confirm the login page loads.
- [ ] Sign in and confirm the session remains active after refresh.
- [ ] Verify at least one authenticated API request in the browser network panel reaches Render.
- [ ] Test student/quiz CSV upload and blueprint image upload where enabled.
- [ ] Confirm Render logs contain no Flask debug server output or tracebacks.
- [ ] Confirm the Neon tables are initialized and the application can read/write expected data.
- [ ] Confirm production `.env` files and credentials are not committed.
