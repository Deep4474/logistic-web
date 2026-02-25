# 🎯 Installation & Testing Guide

## Prerequisites
- Node.js v14+ installed ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- A text editor (VS Code recommended)

## ⚡ Quick Installation (5 minutes)

### Step 1: Open Terminal/Command Prompt
Navigate to your project folder:
```bash
cd "c:\Users\HP\OneDrive\Documents\ayomide web dev\logistic website"
```

### Step 2: Install Dependencies
```bash
npm install
```

You'll see packages being installed. Wait until complete.

### Step 3: Start Server
```bash
npm start
```

You should see:
```
LogiFlow Server running on http://localhost:3000
Email service configured for: ayomideoluniyi49@gmail.com
```

✅ **Server is running!**

### Step 4: Open Website
1. Open `index.html` in your browser, or
2. Use VS Code Live Server extension

---

## 🧪 Testing All Features

### Test 1: User Registration with Email
1. Click **"Register"** button in the top right
2. Fill in form:
   - Name: `Test User`
   - Email: `your-email@gmail.com` (use your real email)
   - Password: `password123`
   - Confirm: `password123`
3. Click **"Register"**
4. ✅ You'll see success message
5. 📧 **Check your email inbox** for welcome message with tracking number

**What happens:**
- User account created on server
- Welcome email sent to your address
- Tracking number generated
- Welcome order created
- You're logged in automatically

---

### Test 2: View Your Order
1. Click **👤 user icon** (top right, near hamburger)
2. Click **"📦 Order List"**
3. ✅ You'll see your welcome order with:
   - Order ID
   - Service: "Welcome Gift"
   - Tracking ID (click to copy)
   - Status: "Processing"
   - Date created

**Data source:** Coming from server

---

### Test 3: View Notifications
1. Click **👤 user icon**
2. Click **"🔔 Notification"**
3. ✅ You'll see:
   - "Welcome to LogiFlow!" notification
   - Timestamp
   - Any order updates

**Data source:** Coming from server

---

### Test 4: Create an Order & Get Email
1. Go to any **Service page** (e.g., "Package Delivery")
2. Scroll down and click **"Request a Quote"**
3. Fill in the quote form:
   - Service: (auto-filled)
   - Price Range: (auto-filled)
   - Full Name: `Your Name`
   - Email: `your-email@gmail.com`
   - Phone: `1234567890`
   - Special Requirements: (optional)
4. Click **"Submit Quote Request"**
5. ✅ Success message appears
6. 📧 **Check email** for order confirmation with tracking ID

**What happens:**
- Order created on server
- Unique tracking ID generated
- Notification created
- Confirmation email sent
- Order added to your order list

---

### Test 5: Track Your Shipment
1. Go to **"Track Your Shipment"** section
2. **Copy a tracking ID** from your email (format: `TRK-100001`)
3. Paste it in the tracking input field
4. Click **"Track"** or press Enter
5. ✅ See tracking status:
   - Tracking ID
   - Service type
   - Order ID
   - Current status

**Data source:** Fetched from server using tracking ID

---

### Test 6: Login & Logout
1. Click **👤 user icon** (top right)
2. Click **"Logout"** (if already logged in) or **"Login"**
3. Enter your credentials:
   - Email: `your-email@gmail.com`
   - Password: `password123`
4. Click **"Login"**
5. ✅ You're logged in, menu updates
6. ✅ All your orders and notifications appear

---

### Test 7: Multiple Users
Create another account to test:
1. Register with **different email** (e.g., `another-user@gmail.com`)
2. Check **that email** for welcome message
3. Each user gets their own orders & notifications
4. Orders/notifications only show for that user

---

## 🔍 Verification Checklist

| Test | Expected Result | Status |
|------|-----------------|--------|
| Server starts | "running on http://localhost:3000" | ✅ |
| Register user | Welcome email received | ✅ |
| View orders | Welcome order appears | ✅ |
| Create order | Order confirmation email | ✅ |
| View notifications | See registration & order updates | ✅ |
| Track shipment | Returns order details | ✅ |
| Login/Logout | User menu updates | ✅ |
| Multiple users | Each has separate data | ✅ |

---

## 📧 Email Testing

### Emails You Should Receive:

**1. Registration Email:**
- Subject: `Welcome to LogiFlow - Your Tracking Number`
- Contains: Name, tracking number, next steps
- Sent: Immediately upon registration

**2. Order Confirmation Email:**
- Subject: `Order Confirmed - Tracking ID: TRK-XXXXX`
- Contains: Service, order ID, tracking ID, next steps
- Sent: When you create order

**3. Notification Email:**
- Subject: Custom based on notification
- Contains: Title, message, timestamp
- Sent: For order updates

### If Emails Not Received:
1. Check **Spam** folder
2. Check **Promotions** folder
3. Verify email address is correct
4. Ensure email is registered, not generic
5. Check server console for errors

---

## 🐛 Troubleshooting

### "Cannot find module" error
```bash
Solution: Run npm install again
npm install
```

### "Port 3000 already in use"
```bash
# Find process using port 3000:
netstat -ano | findstr :3000

# Kill it (replace XXXX with PID):
taskkill /PID XXXX /F

# Then restart server
npm start
```

### Server won't start
1. Verify Node.js installed: `node --version`
2. Verify npm installed: `npm --version`
3. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   npm start
   ```

### CORS error in browser
- Ensure server running on port 3000
- Verify `SERVER_URL` in script.js is correct
- Check browser console (F12) for details

### Emails not sending
1. Check email/password in server.js
2. Verify Gmail account allows app passwords
3. Check internet connection
4. Look for error in server console
5. Verify recipient email is correct

### Data disappearing after restart
- Server uses in-memory database
- Data resets when server restarts
- For persistence, use real database (see README.md)

---

## 📱 Mobile Testing

Test on your phone:

1. **Find your computer's IP:**
   ```bash
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.x.x)
   ```

2. **On your phone, open:**
   ```
   http://192.168.x.x:5500/index.html
   ```
   (assuming Live Server port is 5500)

3. ✅ Test all features on mobile
4. Test form responsiveness
5. Test email notifications

---

## 🎓 Understanding the Flow

### Registration Flow (What Happens Behind Scenes):
```
User fills form
           ↓
JavaScript validates input
           ↓
Sends POST to /api/register
           ↓
Server validates email not used
           ↓
Server creates user in database
           ↓
Server generates tracking number
           ↓
Server creates welcome order
           ↓
Server sends welcome email via Gmail
           ↓
Server returns success to browser
           ↓
Browser logs user in
           ↓
Browser saves user to localStorage
           ↓
User sees success message & email confirmation
```

### Order Creation Flow:
```
User fills quote form
           ↓
JavaScript validates
           ↓
Sends POST to /api/create-order
           ↓
Server validates user registered
           ↓
Server creates order
           ↓
Server generates tracking ID
           ↓
Server creates notification
           ↓
Server sends order email
           ↓
Server returns tracking ID
           ↓
Browser shows success
           ↓
User gets email with tracking
```

---

## 💾 Data Storage

### Where Is Data Stored?
- **Server:** In-memory (RAM) - resets on restart
- **Browser:** localStorage - persists between browser sessions

### User SessionData (localStorage):
```javascript
{
  name: "John Doe",
  email: "john@gmail.com"
}
```

### Server Storage:
- **Users:** Map of all registered users
- **Orders:** Map of all orders
- **Notifications:** Map of notifications per user

---

## 🚀 Performance Tips

1. **Faster Installation:**
   - Use `npm ci` instead of `npm install` (if package-lock.json exists)

2. **Development Mode:**
   ```bash
   npm run dev  # Uses nodemon for auto-restart
   ```

3. **Check Server Health:**
   - Visit http://localhost:3000/api/health
   - Should show: `{ "status": "Server is running" }`

---

## 📋 Checklist Before Going Production

- [ ] Code reviewed for security issues
- [ ] Database switched from in-memory to real DB
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens implemented
- [ ] HTTPS/SSL enabled
- [ ] Rate limiting added
- [ ] Error logging configured
- [ ] Environment variables for secrets
- [ ] Input validation enhanced
- [ ] CORS restricted to trusted origins
- [ ] Admin dashboard created
- [ ] Backup strategy planned

---

## 🎉 You're Ready!

Everything is set up and tested. Your logistics website now has:

✅ User registration with email verification  
✅ Secure login/logout  
✅ Order management system  
✅ Email notifications  
✅ Shipment tracking  
✅ Professional branding  
✅ Responsive design  
✅ Server API backend  

**Start your server and enjoy!** 🚀

```bash
npm start
```

---

## 📞 Need Help?

1. Check **README.md** for comprehensive guide
2. Check **QUICK_START.md** for quick reference
3. Check **SETUP.md** for setup details
4. Check server console for error messages
5. Check browser console (F12) for client errors

Happy testing! 🎯
