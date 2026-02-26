# LogiFlow — Local Development

This repository contains the LogiFlow Node.js app. The instructions below show how to run the app locally on your machine (no cloud provider required).

## Quick summary
- Start command: `npm start`
- Build command: `npm install`
- Default port: `3000` (the app uses `process.env.PORT || 3000`)

## Running locally
1. Install dependencies:

```bash
npm install
```

2. (Optional) Create a `.env` file in the project root to override defaults, for example:

```
# .env
PORT=3000
EMAIL_USER=you@example.com
EMAIL_PASS=<your-smtp-password>
```

   If you plan to use Supabase (cloud or local), you can also define the
   following keys here or in a separate `.env.local` file: `SUPABASE_URL`,
   `SUPABASE_ANON_KEY` and (for server code) `SUPABASE_SERVICE_ROLE_KEY`.

   To simplify local development there is a helper script
   `scripts/setup-supabase-local.ps1` which starts the Supabase CLI and
   writes a `.env.local` file with the appropriate `localhost` values (see
   "Using Supabase Locally" below).

3. Start the server:

```bash
npm start
```

4. Open the site at `http://localhost:3000` (or open `index.html` in your browser for static pages).

## Using Supabase Locally
1. Install the Supabase CLI (`npm install -g supabase`).
2. From the project root run:

   ```powershell
   .\scripts\setup-supabase-local.ps1
   ```

   That command starts the Docker-based local instance, prints the anon and
   service keys, and creates/updates `.env.local` with the correct values.

3. When finished, stop the local services with `supabase stop`.


## If emails are not delivered
1. Check the server console for `Email transporter configured` messages and any errors.
2. If using Gmail, ensure `EMAIL_PASS` is an App Password and 2FA is enabled.
3. If you plan to use a third-party email provider, set the appropriate env vars in `.env`.
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
