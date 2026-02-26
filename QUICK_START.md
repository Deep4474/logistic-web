# 🚀 LogiFlow Server - Quick Start Guide

## Step 1: Install Dependencies
```bash
npm install
```

This will install:
- **express** - Web server framework
- **nodemailer** - Email sending service
- **cors** - Cross-Origin Resource Sharing
- **body-parser** - Parse request bodies
- **dotenv** - Environment variables

## Step 2: Start the Server
```bash
npm start
```

You should see:
```
LogiFlow Server running on http://localhost:3000
Email service configured for: ayomideoluniyi49@gmail.com
```

## Step 3: Open Website
Open `index.html` in your browser (use Live Server if using VS Code)

## ✨ Features Ready to Use

### 1. Register (Create Account)
- Click "Register" button
- Fill in: Name, Email, Password
- You'll receive a welcome email with a tracking number
- A welcome order is automatically created

### 2. Login
- Use your registered email & password
- Your data persists in browser

### 3. View Orders
- Click user icon → "📦 Order List"
- See all your orders with tracking numbers
- Shows service type, status, and dates

### 4. Receive Notifications
- Click user icon → "🔔 Notification"
- See notification history
- Get emails for registration, orders, updates

### 5. Track Shipment
- Go to "Track Your Shipment" section
- Enter any tracking number (like TRK-100001)
- View real-time shipping status

### 6. Create Orders
- Go to any service page
- Click "Request Quote"
- Fill details and submit
- Get confirmation email with tracking ID

## 🧪 Test Accounts

You can register new accounts and they will all receive emails at their registered email address.

### Test with Your Email:
1. Register with your email
2. Check email inbox for welcome message
3. Check for order confirmation emails

## 📧 Email Service

All emails are sent to the email address you register with:
- Welcome email with tracking number
- Order confirmation with tracking ID
- Notification updates

**Important:** The system uses Gmail SMTP configured with:
- Email: ayomideoluniyi49@gmail.com
- Password: likh uveo kyvv afzt (App-specific)

## 🔑 Key Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/register | Create new user account |
| POST | /api/login | Login user |
| GET | /api/orders/:email | Get user's orders |
| POST | /api/create-order | Create new order |
| GET | /api/track/:trackingId | Track shipment |
| GET | /api/notifications/:email | Get notifications |
| GET | /api/health | Check server status |

## ⚙️ How It Works

### Registration Flow:
1. User fills registration form
2. Server validates input
3. User account created in memory
4. Welcome email sent with tracking number
5. Welcome order created automatically
6. User logged in and menu updated

### Order Creation Flow:
1. User fills quote form on service page
2. Server receives request
3. Order created with unique tracking ID
4. Notification created
5. Confirmation email sent
6. Order appears in user's order list

### Email Sending:
- Uses Nodemailer with Gmail SMTP
- HTML formatted professional emails
- Includes tracking numbers and order details
- Sent to user's registered email

## 🛠️ Troubleshooting

### Port 3000 Already in Use?
```bash
# Kill the process using port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

### Emails Not Sending?
1. Check email address in server.js is correct
2. Verify Gmail app password
3. Check server console for error messages
4. Ensure internet connection works

### CORS Errors?
The server already has CORS enabled. If you still get errors:
1. Ensure server is running on http://localhost:3000
2. Check browser console (F12) for detailed errors
3. Verify fetch URLs match server endpoints

### Data Not Persisting?
This version uses in-memory storage (resets on server restart). For production:
- Add MongoDB, PostgreSQL, or MySQL
- Data will persist after server restarts
- Better for real applications

## 📝 What Happens When...

### ...User Registers?
✅ Account created  
✅ Welcome email sent to their registered email  
✅ Tracking number generated  
✅ Welcome order created  
✅ User automatically logged in  
✅ User menu updated

### ...User Creates Order?
✅ Order stored on server  
✅ Unique tracking ID generated  
✅ Notification created  
✅ Confirmation email sent  
✅ Order appears in order list  

### ...User Views Notifications?
✅ Fetches from server  
✅ Shows all notification history  
✅ Includes registration confirmations  
✅ Includes order updates  
✅ Shows timestamps  

### ...User Tracks Shipment?
✅ Searches server database  
✅ Returns order details  
✅ Shows current status  
✅ Shows order information  

## 🎯 Next Steps (Optional Enhancements)

1. **Add Database** - Replace in-memory with MongoDB/PostgreSQL
2. **Password Hashing** - Use bcrypt to hash passwords
3. **JWT Tokens** - Implement proper authentication
4. **Admin Dashboard** - View all users and orders
5. **Payment Integration** - Add Stripe/PayPal
6. **SMS Notifications** - Add Twilio for text alerts
7. **Real Tracking** - Integrate with shipping APIs

---

**Everything is ready to go!** 🎉

Your email notifications system is fully functional and users will receive:
- ✅ Welcome emails when they register
- ✅ Order confirmations when they place orders
- ✅ Notifications for order updates
- ✅ Tracking numbers with all communications
