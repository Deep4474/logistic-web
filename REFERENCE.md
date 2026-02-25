# 🎯 Quick Reference Card

## Installation (2 minutes)

```bash
npm install
npm start
# Server runs on http://localhost:3000
```

## Email Credentials
- **Email:** ayomideoluniyi49@gmail.com
- **Password:** likh uveo kyvv afzt
- **Service:** Gmail SMTP

## User Registration Flow
1. Click "Register" button
2. Fill: Name, Email, Password
3. Submit → Welcome email sent with tracking #
4. Check email inbox
5. Automatically logged in

## User Login Flow
1. Click "Login" button or use login modal
2. Enter: Email, Password
3. Click Login
4. Menu updates showing user options

## Create Order Flow
1. Go to Service page
2. Click "Request a Quote"
3. Fill form
4. Submit → Confirmation email with tracking ID
5. Check email

## View Orders
```
User Icon → 📦 Order List → See all orders
```

## View Notifications
```
User Icon → 🔔 Notification → See all notifications
```

## Track Shipment
1. Get tracking ID from email (format: TRK-100001)
2. Go to "Track Your Shipment"
3. Paste tracking ID
4. Click "Track"
5. See order status & details

## API Endpoints

| Endpoint | Method | Body |
|----------|--------|------|
| /api/register | POST | {registerName, registerEmail, registerPassword} |
| /api/login | POST | {email, password} |
| /api/orders/:email | GET | - |
| /api/create-order | POST | {email, service, priceRange, specialRequirements} |
| /api/track/:trackingId | GET | - |
| /api/notifications/:email | GET | - |
| /api/health | GET | - |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Server won't start | `npm install` again |
| Port 3000 in use | Kill process, restart server |
| No email received | Check spam, verify config |
| CORS error | Verify server is running |

## File Locations

```
server.js              Main backend
script.js              Frontend integration
package.json           Dependencies
.env                   Email config
README.md              Full docs
QUICK_START.md         Quick ref
INSTALL_TEST.md        Setup guide
```

## Testing Checklist
- [ ] npm install (no errors)
- [ ] npm start (server running)
- [ ] Register (welcome email)
- [ ] Login (menu updates)
- [ ] View orders (shows data)
- [ ] Create order (get email)
- [ ] Track order (shows status)
- [ ] Logout (menu resets)

## Data Format

### Tracking ID
```
Format: TRK-100000+
Example: TRK-100001
```

### Order Response
```json
{
  "id": 1001,
  "userEmail": "user@example.com",
  "service": "Package Delivery",
  "trackingId": "TRK-100001",
  "status": "Confirmed",
  "createdAt": "2026-02-24T00:00:00Z"
}
```

### Notification Response
```json
[
  {
    "id": "abc123",
    "type": "order_created",
    "title": "Order Confirmed",
    "message": "Your order has been confirmed",
    "read": false,
    "timestamp": "2026-02-24T00:00:00Z"
  }
]
```

## Browser Local Storage
```javascript
// User data stored as:
localStorage.currentUser = JSON.stringify({
  name: "John Doe",
  email: "john@example.com"
})

// Persists across browser sessions
// Cleared on logout
```

## Email Templates

### Welcome Email
- Subject: "Welcome to LogiFlow - Your Tracking Number"
- Contains: Name, tracking number, next steps

### Order Email
- Subject: "Order Confirmed - Tracking ID: TRK-XXX"
- Contains: Service, order ID, tracking ID, delivery info

### Notification Email
- Custom subject line
- Contains: Title, message, timestamp

## Development Mode

```bash
# Auto-restart server on file changes
# (Requires nodemon in package.json)
npm run dev
```

## Environment Variables (.env)
```
EMAIL_USER=ayomideoluniyi49@gmail.com
EMAIL_PASS=likh uveo kyvv afzt
PORT=3000
NODE_ENV=development
```

## Server Status
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Should return:
# { "status": "Server is running" }
```

## Common Commands

```bash
# Install dependencies
npm install

# Start server
npm start

# Start with auto-reload
npm run dev

# List all users (for testing)
http://localhost:3000/api/users
```

## Features Summary

✅ User registration with email  
✅ User login/logout  
✅ Order creation  
✅ Order history  
✅ Email notifications  
✅ Shipment tracking  
✅ Notification center  
✅ Session persistence  

## Support Files

📖 README.md - Full documentation  
⚡ QUICK_START.md - Quick reference  
🚀 INSTALL_TEST.md - Installation guide  
📋 SETUP.md - Architecture details  
🎯 COMPLETION.md - What was created  

## Remember

- Server runs on `localhost:3000`
- Frontend makes requests to `http://localhost:3000/api/*`
- Emails sent via Gmail SMTP
- Data resets when server restarts
- Session stored in browser localStorage

---

**Need more details?** Check README.md  
**Need to install?** Check INSTALL_TEST.md  
**Need quick help?** Check QUICK_START.md
