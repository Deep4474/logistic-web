# LogiFlow — Deployment Guide

This repository contains the LogiFlow Node.js app. This README explains how to deploy to Render and configure environment variables (no secrets are stored in the repo).

## Quick summary
- Start command: `npm start`
- Build command: `npm install`
- Port: Render provides `PORT` automatically; the app uses `process.env.PORT`.

## Required environment variables (set in Render dashboard)
- `NODE_ENV` = `production`
- `MONGODB_URI` = your MongoDB Atlas connection string (recommended)
- `EMAIL_USER` = sender email address (e.g. your Gmail)
- `EMAIL_PASS` = Gmail App Password (16 chars) or SMTP password
- `EMAIL_SERVICE` = `gmail`
- `DISABLE_SENDGRID` = `true` (set to `false` only if you set `SENDGRID_API_KEY`)
- (Optional) `SENDGRID_API_KEY` if you prefer SendGrid; then set `DISABLE_SENDGRID=false`

### Notes
- Do NOT commit secrets to GitHub. Use Render's Environment variables UI.
- If `MONGODB_URI` is not provided, the app falls back to file-based JSON storage (ephemeral on Render). Use Atlas for production.
- If using Gmail SMTP, enable 2FA and generate an App Password for `EMAIL_PASS`.

## Deploying to Render (UI)
1. Sign in to Render (https://render.com).
2. Click `New` → `Web Service`.
3. Connect your GitHub repo and choose branch `main`.
4. Set Build Command: `npm install` and Start Command: `npm start`.
5. Add the environment variables listed above in the Environment section.
6. Create the service and watch the deploy logs.

## Deploying to Render (using API)
You can set environment variables programmatically using the Render API. See `scripts/render-set-env.ps1` for a PowerShell template.

## Testing after deploy
- Healthcheck:
  ```bash
  curl https://<your-service>.onrender.com/api/ping
  ```
- Register test user:
  ```bash
  curl -X POST https://<your-service>.onrender.com/api/register \
    -H "Content-Type: application/json" \
    -d '{"registerName":"DiagUser","registerEmail":"you@yourdomain.com","registerPassword":"Test1234"}'
  ```
- View users (if using file storage):
  ```bash
  curl https://<your-service>.onrender.com/api/users
  ```

## If emails are not delivered
1. Check Render logs for lines containing `Email transporter configured` and any `Primary email send error` messages.
2. If using Gmail, ensure `EMAIL_PASS` is an App Password.
3. If you set `SENDGRID_API_KEY`, check your SendGrid Activity and Suppressions.

If you want, provide your Render service URL and the log lines and I will help interpret them.
# LogiFlow - Logistics Website Backend Setup

## 📋 Requirements
- Node.js (v14 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email
The email credentials are already configured in the server for:
- **Email:** ayomideoluniyi49@gmail.com
- **Password:** likh uveo kyvv afzt (App-specific password for Gmail)

### 3. Start the Server
```bash
npm start
```

The server will run on `http://localhost:3000`

### 4. Access the Website
Open `index.html` in your browser (or use Live Server extension in VS Code)

## 📝 Features Implemented

### ✅ User Registration
- Users can register with name, email, and password
- Welcome email is sent with a unique tracking number
- Initial order is created for welcome tracking

### ✅ User Login
- Secure login with email and password validation
- User data persists in localStorage

### ✅ Email Notifications
- Welcome email upon registration
- Order confirmation emails with tracking IDs
- Notifications are sent to registered user emails

### ✅ Order Management
- Create orders from service pages
- Orders are stored on the server
- Tracking IDs automatically generated
- View all orders in "Order List"

### ✅ Notifications System
- In-app notifications for all activities
- Email notifications for orders and updates
- Notifications history accessible from user menu

### ✅ Tracking System
- Unique tracking numbers for each shipment
- Track orders using tracking ID
- Real-time status updates

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Orders
- `POST /api/create-order` - Create new order
- `GET /api/orders/:email` - Get user's orders
- `GET /api/track/:trackingId` - Track shipment

### Notifications
- `GET /api/notifications/:email` - Get user notifications
- `POST /api/send-notification` - Send notification

### Utilities
- `GET /api/health` - Check server status
- `GET /api/users` - List all registered users (demo)

## 📧 Email Configuration Details

The system uses Gmail SMTP with an app-specific password:
- **Service:** Gmail
- **Email:** ayomideoluniyi49@gmail.com
- **App Password:** likh uveo kyvv afzt

All emails are sent in HTML format with professional branding.

## 🗂️ Project Structure

```
logistic website/
├── index.html                 # Main homepage
├── service-*.html            # Service detail pages
├── styles.css                # All styling
├── script.js                 # Frontend logic with server integration
├── server.js                 # Express server with API endpoints
├── package.json              # Dependencies
├── .env                      # Environment variables
└── README.md                 # Documentation (this file)
```

## 🔐 Security Notes

⚠️ **Important for Production:**
1. Never commit `.env` file to public repositories
2. Use environment variables from your hosting provider
3. Hash passwords before storing in database
4. Use a real database (MongoDB, PostgreSQL, etc.)
5. Implement JWT authentication tokens
6. Enable HTTPS
7. Add rate limiting to API endpoints

## 🧪 Testing the System

### Register a User:
1. Click "Register" button
2. Fill in name, email, password
3. Check the registered email for welcome message with tracking number

### Create an Order:
1. Login with registered credentials
2. Go to any service page
3. Click "Request Quote" and submit
4. Check email for order confirmation

### View Orders:
1. Click user icon → Profile menu
2. Click "📦 Order List"
3. See all your orders with tracking IDs

### View Notifications:
1. Click user icon → Profile menu
2. Click "🔔 Notification"
3. See all notification history

## 🐛 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
# Try clearing node_modules and reinstalling
rm -rf node_modules
npm install
npm start
```

### Emails Not Sending
1. Verify Gmail credentials are correct
2. Check Gmail account security settings
3. Ensure "Less secure apps" is enabled (if not using app-specific password)
4. Check server console for error messages

### CORS Issues
The server has CORS enabled for all origins. If you still get errors:
1. Ensure server is running on http://localhost:3000
2. Check browser console for detailed error messages
3. Verify fetch URLs in script.js are correct

## 📞 Support

For issues or questions:
1. Check the console (F12 in browser) for error messages
2. Verify server is running: http://localhost:3000/api/health
3. Check email configuration in server.js

---

**Created:** February 2026
**Server:** Node.js + Express
**Email Service:** Nodemailer with Gmail
