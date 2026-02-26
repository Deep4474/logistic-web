Deploying to Render

1) Create a GitHub repository and push your code (already pushed).

2) Prepare Render service
- Sign in to https://render.com and create a new "Web Service".
- Connect your GitHub account and select the `logistic-web` repository.

3) Build & Start settings
- Branch: `main`
- Build Command: `npm install`
- Start Command: `npm start` (runs `node server.js`)
- Environment: Node

4) Environment variables (set in Render dashboard > Environment > Environment Groups)
- `EMAIL_USER` : your SMTP user or sender email
- `EMAIL_PASS` : SMTP password or app password
- `EMAIL_SERVICE` : e.g., `gmail` (optional)
- `SENDGRID_API_KEY` : if using SendGrid (optional)
- `DISABLE_SENDGRID` : `true` or `false`
- `MONGODB_URI` : your MongoDB Atlas connection string (optional)
- `PORT` : leave empty (Render sets its own PORT), or set to `10000` for testing
- `RND_API_KEY` : your random project key (do not commit this file)

5) Files to ignore (already in .gitignore)
- `.env`
- `node_modules/`
- `/pictures/`

6) Persistent storage note
- Render services are ephemeral. If you need persistent file storage for uploaded pictures, use an external storage service (S3, DigitalOcean Spaces, etc.) or a managed database.

7) After creating the service
- Trigger a deploy from the Render dashboard.
- Check the Deploy logs for `LogiFlow Server running on http://localhost:<PORT>` and the `RND_API_KEY loaded` message.
- Visit the provided Render URL to test endpoints, e.g., `https://<your-service>.onrender.com/api/ping`.

8) Helpful commands (run locally before pushing)
```powershell
# Run server locally
npm install
npm start

# Run in development
npm run dev
```

If you want, I can:
- create a `render.yaml` preset for Render (CI-based deploy), or
- open the Render dashboard and help you configure environment variables step-by-step.
