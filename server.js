const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');
// load .env then .env.local (locals override defaults)
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

// initialize Supabase client if environment provides valid variables
// support multiple key names so we can use anon or service role keys
const SUPABASE_URL = process.env.SUPABASE_URL;
// prefer explicit SUPABASE_KEY, fall back to anon or service role names
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// validate that SUPABASE_URL is a real URL (not a placeholder or invalid format)
function isValidSupabaseUrl(url) {
    if (!url || typeof url !== 'string') return false;
    // check if it looks like a placeholder (contains angle brackets, parentheses, or "<YOUR_")
    if (url.includes('<') || url.includes('>') || url.includes('(') || url.includes(')')) return false;
    // must match http:// or https://
    return /^https?:\/\//i.test(url);
}

let supabase = null;
if (isValidSupabaseUrl(SUPABASE_URL) && SUPABASE_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized using ' +
            (process.env.SUPABASE_KEY ? 'SUPABASE_KEY' : process.env.SUPABASE_ANON_KEY ? 'SUPABASE_ANON_KEY' : 'SUPABASE_SERVICE_ROLE_KEY')
        );
    } catch (err) {
        console.warn('Failed to initialize Supabase:', err.message);
    }
} else if (SUPABASE_URL && !isValidSupabaseUrl(SUPABASE_URL)) {
    console.log('SUPABASE_URL is not a valid URL (placeholder?); skipping Supabase initialization');
}


const app = express();
const PORT = process.env.PORT || 3000;

// File paths for JSON storage
// Use `DATA_DIR` env var when provided (useful for custom setups),
// otherwise store data in the project directory for local development.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const usersFilePath = path.join(DATA_DIR, 'users.json');
const ordersFilePath = path.join(DATA_DIR, 'orders.json');
const notificationsFilePath = path.join(DATA_DIR, 'notifications.json');
const picturesDir = path.join(DATA_DIR, 'pictures');

// Ensure data and pictures directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(picturesDir)) {
    fs.mkdirSync(picturesDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, picturesDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `package-${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));
app.use('/pictures', express.static(picturesDir));

// Global error handlers to aid debugging when server crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason && reason.stack ? reason.stack : reason);
});

// Simple health-check endpoint for quick verification
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Email Configuration - prefer transactional provider (SendGrid) when available
const EMAIL_USER = process.env.EMAIL_USER || process.env.EMAIL || 'ayomideoluniyi49@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '';

// Custom project API key loaded from environment
const RND_API_KEY = process.env.RND_API_KEY || '';
if (RND_API_KEY) {
    console.log('RND_API_KEY loaded (length:', RND_API_KEY.length + ')');
} else {
    console.log('RND_API_KEY not set');
}

let transporter;
// Allow disabling SendGrid explicitly (set DISABLE_SENDGRID=true in .env to force SMTP fallback)
const disableSendgrid = String(process.env.DISABLE_SENDGRID || '').toLowerCase() === 'true';

if (process.env.SENDGRID_API_KEY && !disableSendgrid) {
    // Use SendGrid SMTP relay (recommended on platforms that block direct SMTP)
    transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
        }
    });
    console.log('Email transporter configured: SendGrid SMTP');
} else {
    if (process.env.SENDGRID_API_KEY && disableSendgrid) {
        console.log('SENDGRID_API_KEY present but DISABLE_SENDGRID=true — using SMTP fallback');
    }
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        }
    });
    console.log('Email transporter configured:', process.env.EMAIL_SERVICE || 'gmail', disableSendgrid ? '(SendGrid disabled)' : '');
}

// Optional explicit Gmail SMTP transport (used as a fallback when using an app password)
let gmailTransport;
if (EMAIL_USER && EMAIL_USER.toLowerCase().endsWith('@gmail.com') && EMAIL_PASS) {
    try {
        gmailTransport = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        });
        console.log('Gmail fallback transporter prepared (port 465)');
    } catch (e) {
        console.warn('Could not prepare Gmail fallback transporter:', e.message);
        gmailTransport = null;
    }
}

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI;
let db = null;
let mongoClient = null;

async function connectMongoDB() {
    try {
        if (MONGODB_URI) {
            const mongoOptions = {
                tlsAllowInvalidCertificates: true,
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                w: 'majority'
            };
            mongoClient = new MongoClient(MONGODB_URI, mongoOptions);
            await mongoClient.connect();
            db = mongoClient.db('logisticdb');
            
            // Create collections if they don't exist
            const collections = await db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            
            if (!collectionNames.includes('users')) {
                await db.createCollection('users');
                console.log('Created users collection');
            }
            if (!collectionNames.includes('orders')) {
                await db.createCollection('orders');
                console.log('Created orders collection');
            }
            if (!collectionNames.includes('notifications')) {
                await db.createCollection('notifications');
                console.log('Created notifications collection');
            }
            
            console.log('MongoDB connected successfully');
            return true;
        } else {
            console.warn('MONGODB_URI not set, falling back to JSON file storage');
            return false;
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return false;
    }
}

// Helper functions for JSON file storage
function readUsersFile() {
    try {
        if (!fs.existsSync(usersFilePath)) {
            fs.writeFileSync(usersFilePath, JSON.stringify({ users: [] }, null, 2));
        }
        const data = fs.readFileSync(usersFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Ensure users array exists
        if (!parsed.users || !Array.isArray(parsed.users)) {
            return { users: [] };
        }
        return parsed;
    } catch (error) {
        console.error('Error reading users file:', error);
        return { users: [] };
    }
}

function writeUsersFile(data) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(data, null, 2));
        try {
            const usersCount = Array.isArray(data.users) ? data.users.length : 'N/A';
            const lastUser = (Array.isArray(data.users) && data.users.length > 0) ? (data.users[data.users.length - 1].email || data.users[data.users.length - 1].name) : null;
            console.log(`writeUsersFile: wrote users.json (${usersCount} users) last=${lastUser}`);
        } catch (logErr) {
            console.warn('writeUsersFile: could not log details', logErr && logErr.message ? logErr.message : logErr);
        }
    } catch (error) {
        console.error('Error writing users file:', error);
    }
}

function readOrdersFile() {
    try {
        if (!fs.existsSync(ordersFilePath)) {
            fs.writeFileSync(ordersFilePath, JSON.stringify({ orders: [], nextOrderId: 1001, nextTrackingId: 100000 }, null, 2));
        }
        const data = fs.readFileSync(ordersFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Ensure proper structure
        if (!parsed.orders || !Array.isArray(parsed.orders) || !parsed.nextOrderId || !parsed.nextTrackingId) {
            return { orders: [], nextOrderId: 1001, nextTrackingId: 100000 };
        }
        return parsed;
    } catch (error) {
        console.error('Error reading orders file:', error);
        return { orders: [], nextOrderId: 1001, nextTrackingId: 100000 };
    }
}

function writeOrdersFile(data) {
    try {
        fs.writeFileSync(ordersFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing orders file:', error);
    }
}

function readNotificationsFile() {
    try {
        if (!fs.existsSync(notificationsFilePath)) {
            fs.writeFileSync(notificationsFilePath, JSON.stringify({ notifications: {} }, null, 2));
        }
        const data = fs.readFileSync(notificationsFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        
        // Ensure notifications object exists
        if (!parsed.notifications || typeof parsed.notifications !== 'object') {
            return { notifications: {} };
        }
        return parsed;
    } catch (error) {
        console.error('Error reading notifications file:', error);
        return { notifications: {} };
    }
}

function writeNotificationsFile(data) {
    try {
        fs.writeFileSync(notificationsFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing notifications file:', error);
    }
}

// ------------------------------------------------------------------
// Supabase / storage helper functions
// these helpers pick the appropriate backend (Supabase, MongoDB, or
// JSON file) depending on what has been configured.

async function findUserByEmail(email) {
    if (supabase) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .limit(1);
        if (error) throw error;
        return data[0] || null;
    }
    if (db) {
        return await db.collection('users').findOne({ email });
    }
    const usersData = readUsersFile();
    return usersData.users.find(u => u.email === email) || null;
}

async function insertUser(user) {
    if (supabase) {
        const { error } = await supabase.from('users').insert(user);
        if (error) throw error;
        return;
    }
    if (db) {
        await db.collection('users').insertOne(user);
    } else {
        const usersData = readUsersFile();
        usersData.users.push(user);
        writeUsersFile(usersData);
    }
}

async function getOrdersByUserEmail(email) {
    if (supabase) {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_email', email);
        if (error) throw error;
        return data;
    }
    const ordersData = readOrdersFile();
    return ordersData.orders.filter(o => o.userEmail === email);
}

async function addOrder(order) {
    if (supabase) {
        const { error } = await supabase.from('orders').insert(order);
        if (error) throw error;
        return;
    }
    const ordersData = readOrdersFile();
    ordersData.orders.push(order);
    writeOrdersFile(ordersData);
}

async function getNotificationsByEmail(email) {
    if (supabase) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_email', email);
        if (error) throw error;
        return data;
    }
    const notificationsData = readNotificationsFile();
    return notificationsData.notifications[email] || [];
}

async function addNotification(userEmail, notif) {
    if (supabase) {
        const { error } = await supabase.from('notifications').insert({
            user_email: userEmail,
            ...notif
        });
        if (error) throw error;
        return;
    }
    const notificationsData = readNotificationsFile();
    if (!notificationsData.notifications[userEmail]) {
        notificationsData.notifications[userEmail] = [];
    }
    notificationsData.notifications[userEmail].push(notif);
    writeNotificationsFile(notificationsData);
}

// ------------------------------------------------------------------

// Helper function to generate tracking ID
function generateTrackingId() {
    const ordersData = readOrdersFile();
    const trackingId = `TRK-${ordersData.nextTrackingId}`;
    ordersData.nextTrackingId++;
    writeOrdersFile(ordersData);
    return trackingId;
}

// Helper function to generate order ID
function generateOrderId() {
    const ordersData = readOrdersFile();
    const orderId = ordersData.nextOrderId;
    ordersData.nextOrderId++;
    writeOrdersFile(ordersData);
    return orderId;
}

// Helper function to send email
async function sendEmail(to, subject, html) {
    try {
        const mailOptions = {
            from: EMAIL_USER || 'no-reply@logiflow.local',
            to: to,
            subject: subject,
            html: html
        };
        // Try primary transporter first
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${to} via primary transporter`);
            return true;
        } catch (primaryError) {
            console.error('Primary email send error:', primaryError && primaryError.message ? primaryError.message : primaryError);

            // If primary failed and we have a Gmail fallback, try that
            if (gmailTransport) {
                try {
                    await gmailTransport.sendMail(mailOptions);
                    console.log(`Email sent to ${to} via Gmail fallback transporter`);
                    return true;
                } catch (gmailErr) {
                    console.error('Gmail fallback send error:', gmailErr && gmailErr.message ? gmailErr.message : gmailErr);
                    return false;
                }
            }

            return false;
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Generic API endpoint to send templated emails from client
app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, type, data } = req.body;

        if (!to || !subject) {
            return res.status(400).json({ error: 'Missing "to" or "subject" in request' });
        }

        let html = '';

        if (type === 'order_confirmation') {
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0;">Order Received</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                        <p style="color: #333; font-size: 16px;">Hello ${data.senderName || 'Customer'},</p>
                        <p style="color: #666;">Thanks — we've received your order. Your tracking ID is <strong>${data.trackingId}</strong>.</p>
                        <p><strong>Service:</strong> ${data.service || 'N/A'}</p>
                        <p><strong>From:</strong> ${data.from || 'N/A'}</p>
                        <p><strong>To:</strong> ${data.to || 'N/A'}</p>
                        ${data.special ? `<p><strong>Notes:</strong> ${data.special}</p>` : ''}
                        <p style="color: #999; font-size: 12px; margin-top: 20px;">We will email you again when the admin confirms your order.</p>
                    </div>
                </div>
            `;
        } else if (type === 'admin_notification') {
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #333; padding: 20px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
                        <h2 style="margin:0;">New Order Received</h2>
                    </div>
                    <div style="padding:20px; background:#fff; border-radius:0 0 8px 8px;">
                        <p><strong>Service:</strong> ${data.service || 'N/A'}</p>
                        <p><strong>Tracking ID:</strong> ${data.trackingId || 'N/A'}</p>
                        <p><strong>Sender:</strong> ${data.senderName || data.senderEmail || 'N/A'}</p>
                        <p><strong>Sender Email:</strong> ${data.senderEmail || 'N/A'}</p>
                    </div>
                </div>
            `;
        } else if (data && data.html) {
            html = data.html;
        } else {
            html = `<pre>${JSON.stringify(data || {}, null, 2)}</pre>`;
        }

        const sent = await sendEmail(to, subject, html);
        if (sent) return res.json({ message: 'Email sent' });
        return res.status(500).json({ error: 'Failed to send email' });
    } catch (error) {
        console.error('Send-email endpoint error:', error);
        return res.status(500).json({ error: error.message || 'Server error sending email' });
    }
});

// Lightweight health-check endpoint for quick availability tests
app.get('/api/ping', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString(), service: 'LogiFlow' });
});

// Routes

// Register User
app.post('/api/register', async (req, res) => {
    try {
        console.log('DEBUG: /api/register called');
        console.log('DEBUG: req.body =', JSON.stringify(req.body));
        console.log('DEBUG: Content-Type =', req.headers['content-type']);
        
        const { registerName, registerEmail, registerPassword } = req.body;

        // Validation
        if (!registerName || !registerEmail || !registerPassword) {
            console.log('Registration validation failed:', { registerName, registerEmail, registerPassword });
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Hash password
        const salt = crypto.randomBytes(16);
        const iterations = 100000;
        const dk = crypto.pbkdf2Sync(registerPassword, salt, iterations, 32, 'sha256');
        const passwordHash = `pbkdf2_sha256$${iterations}$${salt.toString('hex')}$${dk.toString('hex')}`;
        console.log('DEBUG: Password hashed successfully');

        const newUser = {
            name: registerName,
            email: registerEmail,
            passwordHash: passwordHash,
            registeredAt: new Date().toISOString()
        };

        try {
            // unified storage check using helper (Supabase / Mongo / JSON)
            const userExists = await findUserByEmail(registerEmail);
            if (userExists) {
                console.log('DEBUG: User already exists:', registerEmail);
                return res.status(400).json({ error: 'User already exists' });
            }

            await insertUser(newUser);
            console.log('DEBUG: User stored successfully');
        } catch (storageError) {
            console.error('DEBUG: Error during user storage:', storageError.message);
            return res.status(500).json({ error: 'Error processing registration: ' + storageError.message });
        }

        // Return success immediately (email will be sent in background)
        console.log('DEBUG: Sending 201 response to client');
        res.status(201).json({
            message: 'Registration successful!',
            user: {
                name: registerName,
                email: registerEmail
            }
        });

        // Send email in background (non-blocking)
        console.log('DEBUG: Sending welcome email in background...');
        const welcomeHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0;">Welcome to LogiFlow!</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                    <p style="color: #333; font-size: 16px;">Hello ${registerName},</p>
                    <p style="color: #666; line-height: 1.6;">Thank you for registering with LogiFlow. Your account is ready to use. Log in today to place your first order and get your tracking number!</p>
                    
                    <p style="color: #666; line-height: 1.6;">
                        <strong>Get Started:</strong><br>
                        1. Log in to your account<br>
                        2. Place your first order<br>
                        3. Receive tracking number via email<br>
                        4. Track your shipment in real-time
                    </p>

                    <p style="color: #666; line-height: 1.6;">
                        <strong>Need Help?</strong><br>
                        Visit our contact page or reply to this email with any questions.
                    </p>

                    <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                        Best regards,<br>
                        LogiFlow Team<br>
                        <em>Professional Logistics Solutions</em>
                    </p>
                </div>
            </div>
        `;
        
        sendEmail(registerEmail, 'Welcome to LogiFlow', welcomeHtml).catch(err => {
            console.error('DEBUG: Background email send failed:', err.message);
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Verify password: support new passwordHash format and fall back to legacy plaintext if present
        const verifyPassword = (plain, stored) => {
            try {
                if (!stored) return false;
                if (stored.startsWith('pbkdf2_sha256$')) {
                    const parts = stored.split('$');
                    if (parts.length !== 4) return false;
                    const iterations = parseInt(parts[1], 10);
                    const salt = Buffer.from(parts[2], 'hex');
                    const hash = Buffer.from(parts[3], 'hex');
                    const derived = crypto.pbkdf2Sync(plain, salt, iterations, hash.length, 'sha256');
                    return crypto.timingSafeEqual(derived, hash);
                }
                // legacy plain-text comparison
                return stored === plain;
            } catch (e) {
                return false;
            }
        };

        let passwordOk = false;
        if (user.passwordHash) {
            passwordOk = verifyPassword(password, user.passwordHash);
        } else if (user.password) {
            // legacy: plain-text in file (upgrade on successful login)
            passwordOk = user.password === password;
            if (passwordOk) {
                // upgrade to hashed password
                const salt = crypto.randomBytes(16);
                const iterations = 100000;
                const dk = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
                user.passwordHash = `pbkdf2_sha256$${iterations}$${salt.toString('hex')}$${dk.toString('hex')}`;
                delete user.password;
                writeUsersFile(usersData);
            }
        }

        if (!passwordOk) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({
            message: 'Login successful',
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get Orders by Email
app.get('/api/orders/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const userExists = await findUserByEmail(email);

        if (!userExists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userOrders = await getOrdersByUserEmail(email);

        if (userOrders.length === 0) {
            return res.json({
                message: 'No orders found',
                orders: []
            });
        }

        res.json({
            message: 'Orders retrieved successfully',
            orders: userOrders
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error retrieving orders' });
    }
});

// Get Notifications by Email
app.get('/api/notifications/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const userExists = await findUserByEmail(email);

        if (!userExists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userNotifications = await getNotificationsByEmail(email);

        res.json({
            message: 'Notifications retrieved successfully',
            notifications: userNotifications
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error retrieving notifications' });
    }
});

// Create Order with Picture Upload
app.post('/api/create-order', upload.single('packagePicture'), async (req, res) => {
    try {
        const { email, service, priceRange, specialRequirements, senderAddress, receiverAddress } = req.body;

        if (!email || !service) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Email and service required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Package picture is required' });
        }

        if (!senderAddress || !receiverAddress) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Sender and receiver addresses are required' });
        }

        const userExists = await findUserByEmail(email);

        if (!userExists) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        const trackingId = generateTrackingId();
        const orderId = generateOrderId();
        const picturePath = `/pictures/${req.file.filename}`;

        // build order object for whichever backend is used
        const orderRecord = supabase ? {
            id: orderId,
            user_email: email,
            service,
            price_range: priceRange,
            tracking_id: trackingId,
            picture_url: picturePath,
            sender_address: senderAddress,
            receiver_address: receiverAddress,
            status: 'Pending',
            created_at: new Date(),
            description: specialRequirements || 'Standard shipment'
        } : {
            id: orderId,
            userEmail: email,
            service: service,
            priceRange: priceRange,
            trackingId: trackingId,
            pictureUrl: picturePath,
            senderAddress: senderAddress,
            receiverAddress: receiverAddress,
            status: 'Pending',
            createdAt: new Date(),
            description: specialRequirements || 'Standard shipment'
        };

        await addOrder(orderRecord);

        const notif = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'order_created',
            title: `Order Pending Review - ${service}`,
            message: `Your ${service} order is pending admin confirmation. Tracking ID: ${trackingId}`,
            read: false,
            timestamp: new Date(),
            status: 'Pending'
        };
        await addNotification(email, notif);

        // Send pending order email
        const orderHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0;">Order Submitted!</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                    <p style="color: #333; font-size: 16px;">Hello ${userExists.name},</p>
                    <p style="color: #666; line-height: 1.6; font-size: 18px;"><strong>Your order has been submitted for review.</strong></p>
                    <p style="color: #ff9800; line-height: 1.6; font-size: 16px; font-weight: bold;">⏳ STATUS: PENDING CONFIRMATION</p>
                    <p style="color: #666; line-height: 1.6;">Your package picture has been received and is being reviewed by our admin team. You will receive a confirmation email once your order is approved.</p>
                    
                    <div style="background-color: white; padding: 20px; border: 2px solid #ff9800; margin: 20px 0; border-radius: 8px;">
                        <h3 style="color: #ff9800; margin-top: 0;">Order Details</h3>
                        <p style="margin: 10px 0;"><strong>Service:</strong> ${service}</p>
                        <p style="margin: 10px 0;"><strong>Price Range:</strong> ${priceRange || 'Standard'}</p>
                        <p style="margin: 10px 0;"><strong>Order ID:</strong> ${orderId}</p>
                        <p style="margin: 10px 0; color: #ff9800; font-size: 18px; font-weight: bold;">
                            <strong>Tracking ID: ${trackingId}</strong>
                        </p>
                        <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #ff9800; font-weight: bold;">⏳ Pending</span></p>
                        <p style="margin: 10px 0;"><strong>From:</strong> ${senderAddress}</p>
                        <p style="margin: 10px 0;"><strong>To:</strong> ${receiverAddress}</p>
                    </div>

                    <p style="color: #666; line-height: 1.6;">
                        <strong>What Happens Next?</strong><br>
                        1. Our admin team reviews your package picture<br>
                        2. Order is confirmed within 2-4 hours<br>
                        3. You'll receive a confirmation email<br>
                        4. Your shipment will begin processing
                    </p>

                    <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                        Best regards,<br>
                        LogiFlow Team<br>
                        <em>Professional Logistics Solutions</em>
                    </p>
                </div>
            </div>
        `;

        await sendEmail(email, `Order Submitted - Tracking ID: ${trackingId} (Pending Confirmation)`, orderHtml).catch(err => {
            console.error('Failed to send order email, but order created:', err);
        });

        res.status(201).json({
            message: 'Order submitted successfully! Please wait for admin confirmation.',
            order: {
                orderId: orderId,
                trackingId: trackingId,
                service: service,
                status: 'Pending',
                pictureUrl: picturePath,
                senderAddress: senderAddress,
                receiverAddress: receiverAddress
            }
        });

    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message || 'Server error creating order' });
    }
});

// Update Order (Admin Endpoint)
app.put('/api/update-order', async (req, res) => {
    try {
        const { orderId, status, description, userEmail, sendEmail: shouldSendEmail } = req.body;

        console.log('Update order request:', { orderId, status, description, userEmail, shouldSendEmail });

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID required' });
        }

        const ordersData = readOrdersFile();
        console.log('Current orders count:', ordersData.orders.length);
        
        const orderIndex = ordersData.orders.findIndex(o => o.id === orderId);
        console.log('Order index:', orderIndex, 'Looking for ID:', orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const previousStatus = ordersData.orders[orderIndex].status;
        console.log('Previous status:', previousStatus, 'New status:', status);

        // If Supabase is configured, update remotely
        if (supabase) {
            const updateFields = {};
            if (status) updateFields.status = status;
            if (description !== undefined) updateFields.description = description;
            updateFields.updatedAt = new Date();
            const { error } = await supabase
                .from('orders')
                .update(updateFields)
                .eq('id', orderId);
            if (error) {
                console.error('✗ Supabase update error:', error);
                throw error;
            }
            console.log('✓ Order updated in Supabase');
        }

        // Update the local copy as well (useful for fallback or debugging)
        if (status) {
            ordersData.orders[orderIndex].status = status;
        }
        if (description !== undefined) {
            ordersData.orders[orderIndex].description = description;
        }
        ordersData.orders[orderIndex].updatedAt = new Date();

        if (!supabase) {
            try {
                writeOrdersFile(ordersData);
                console.log('✓ Order saved to file successfully');
            } catch (writeError) {
                console.error('✗ Error writing to orders file:', writeError);
                throw writeError;
            }
        }

        // Send email to user if requested
        if (shouldSendEmail && userEmail) {
            console.log('Sending email to:', userEmail);
            const order = ordersData.orders[orderIndex];
            const userData = readUsersFile();
            const user = userData.users.find(u => u.email === userEmail);
            const userName = user ? user.name : 'Valued Customer';

            // Get status color and emoji
            let statusColor = '#ff9800';
            let statusEmoji = '⏳';
            
            if (status === 'Confirmed') {
                statusColor = '#4caf50';
                statusEmoji = '✅';
            } else if (status === 'In Transit') {
                statusColor = '#2196f3';
                statusEmoji = '🚚';
            } else if (status === 'Out for Delivery') {
                statusColor = '#00bcd4';
                statusEmoji = '📦';
            } else if (status === 'Delivered') {
                statusColor = '#4caf50';
                statusEmoji = '🎉';
            }

            const statusUpdateHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0;">${statusEmoji} Order Status Updated!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                        <p style="color: #333; font-size: 16px;">Hello ${userName},</p>
                        <p style="color: #666; line-height: 1.6; font-size: 18px;"><strong>Your order status has been updated!</strong></p>
                        
                        <div style="background-color: white; padding: 20px; border: 3px solid ${statusColor}; margin: 20px 0; border-radius: 8px;">
                            <h3 style="color: ${statusColor}; margin-top: 0;">New Status</h3>
                            <p style="font-size: 28px; font-weight: bold; color: ${statusColor}; margin: 10px 0;">
                                ${statusEmoji} ${status}
                            </p>
                        </div>

                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #333;">Order Details</h3>
                            <p style="margin: 10px 0;"><strong>Tracking ID:</strong> <span style="color: #667eea; font-weight: bold;">${order.trackingId}</span></p>
                            <p style="margin: 10px 0;"><strong>Service:</strong> ${order.service}</p>
                            <p style="margin: 10px 0;"><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></p>
                            ${description ? `<p style="margin: 10px 0;"><strong>Notes:</strong> ${description}</p>` : ''}
                            <p style="margin: 10px 0;"><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
                        </div>

                        <p style="color: #666; line-height: 1.6;">
                            Thank you for choosing LogiFlow for your logistics needs. Your shipment is being handled with care.
                        </p>

                        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                            Best regards,<br>
                            LogiFlow Team<br>
                            <em>Professional Logistics Solutions</em>
                        </p>
                    </div>
                </div>
            `;

            await sendEmail(userEmail, `Order Status Update: ${status} - Tracking ID: ${order.trackingId}`, statusUpdateHtml).catch(err => {
                console.error('✗ Failed to send status update email:', err.message);
            });
            console.log('✓ Email notification sent');
        } else {
            console.log('Skipping email - shouldSendEmail:', shouldSendEmail, 'userEmail:', userEmail);
        }

        console.log('✓ Order update completed successfully');
        res.json({
            message: 'Order updated successfully',
            order: ordersData.orders[orderIndex]
        });

    } catch (error) {
        console.error('✗ Update order error:', error.message);
        res.status(500).json({ error: 'Server error updating order: ' + error.message });
    }
});

// Confirm Order (Admin Endpoint) - Changes status from Pending to Confirmed
app.post('/api/confirm-order', async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID required' });
        }

        const ordersData = readOrdersFile();
        const orderIndex = ordersData.orders.findIndex(o => o.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = ordersData.orders[orderIndex];

        // Update order status to Confirmed
        ordersData.orders[orderIndex].status = 'Confirmed';
        ordersData.orders[orderIndex].confirmedAt = new Date();
        writeOrdersFile(ordersData);

        // Get user info
        const usersData = readUsersFile();
        const user = usersData.users.find(u => u.email === order.userEmail);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update notification
        const notificationsData = readNotificationsFile();
        if (notificationsData.notifications[order.userEmail]) {
            const notifIndex = notificationsData.notifications[order.userEmail].findIndex(
                n => n.type === 'order_created' && n.message.includes(order.trackingId)
            );
            if (notifIndex !== -1) {
                notificationsData.notifications[order.userEmail][notifIndex].status = 'Confirmed';
                notificationsData.notifications[order.userEmail][notifIndex].title = `Order Confirmed - ${order.service}`;
                notificationsData.notifications[order.userEmail][notifIndex].message = `Your ${order.service} order has been confirmed. Tracking ID: ${order.trackingId}`;
            }
        }
        writeNotificationsFile(notificationsData);

        // Send confirmation email
        const confirmationHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0;">✓ Order Confirmed!</h1>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                    <p style="color: #333; font-size: 16px;">Hello ${user.name},</p>
                    <p style="color: #4caf50; line-height: 1.6; font-size: 18px; font-weight: bold;">✓ Your order has been confirmed!</p>
                    <p style="color: #666; line-height: 1.6;">Your package request has been approved and verified by our admin team. Your shipment is now ready to be processed.</p>
                    
                    <div style="background-color: white; padding: 20px; border: 2px solid #4caf50; margin: 20px 0; border-radius: 8px;">
                        <h3 style="color: #4caf50; margin-top: 0;">✓ Confirmed Order Details</h3>
                        <p style="margin: 10px 0;"><strong>Service:</strong> ${order.service}</p>
                        <p style="margin: 10px 0;"><strong>Price Range:</strong> ${order.priceRange || 'Standard'}</p>
                        <p style="margin: 10px 0;"><strong>Order ID:</strong> ${order.id}</p>
                        <p style="margin: 10px 0; color: #ff6f00; font-size: 18px; font-weight: bold;">
                            <strong>Tracking ID: ${order.trackingId}</strong>
                        </p>
                        <p style="margin: 10px 0;"><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">✓ Confirmed</span></p>
                    </div>

                    <p style="color: #666; line-height: 1.6;">
                        <strong>What Happens Next?</strong><br>
                        1. ✓ Your package has been verified<br>
                        2. Your shipment will be processed within 24 hours<br>
                        3. You'll receive updates via email<br>
                        4. Track live status on our website using your Tracking ID
                    </p>

                    <p style="color: #666; line-height: 1.6;">
                        <strong>Track Your Shipment:</strong><br>
                        Use your tracking ID <strong>${order.trackingId}</strong> to monitor your shipment in real-time from our portal.
                    </p>

                    <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                        Best regards,<br>
                        LogiFlow Team<br>
                        <em>Professional Logistics Solutions</em>
                    </p>
                </div>
            </div>
        `;

        await sendEmail(order.userEmail, `Order Confirmed - Tracking ID: ${order.trackingId} ✓`, confirmationHtml).catch(err => {
            console.error('Failed to send confirmation email:', err);
        });

        res.json({
            message: 'Order confirmed and email sent to user',
            order: ordersData.orders[orderIndex]
        });

    } catch (error) {
        console.error('Confirm order error:', error);
        res.status(500).json({ error: 'Server error confirming order' });
    }
});

// Send Notification Email
app.post('/api/send-notification', async (req, res) => {
    try {
        const { email, title, message } = req.body;

        if (!email || !title) {
            return res.status(400).json({ error: 'Email and title required' });
        }

        const usersData = readUsersFile();
        const user = usersData.users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Store notification
        const notificationsData = readNotificationsFile();
        if (!notificationsData.notifications[email]) {
            notificationsData.notifications[email] = [];
        }
        notificationsData.notifications[email].push({
            id: Math.random().toString(36).substr(2, 9),
            type: 'general',
            title: title,
            message: message,
            read: false,
            timestamp: new Date()
        });
        writeNotificationsFile(notificationsData);

        // Send notification email
        const notifHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
                    <h2 style="margin: 0;">${title}</h2>
                </div>
                <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                    <p style="color: #333; font-size: 16px;">Hello ${user.name},</p>
                    <p style="color: #666; line-height: 1.6;">${message}</p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                        LogiFlow Team
                    </p>
                </div>
            </div>
        `;

        await sendEmail(email, title, notifHtml);

        res.json({
            message: 'Notification sent successfully'
        });

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ error: 'Server error sending notification' });
    }
});

// Track Shipment
app.get('/api/track/:trackingId', (req, res) => {
    try {
        const { trackingId } = req.params;

        const ordersData = readOrdersFile();
        const order = ordersData.orders.find(o => o.trackingId === trackingId);

        if (!order) {
            return res.status(404).json({ error: 'Tracking ID not found' });
        }

        res.json({
            message: 'Tracking information retrieved',
            tracking: {
                trackingId: order.trackingId,
                service: order.service,
                status: order.status,
                orderId: order.id,
                createdAt: order.createdAt,
                description: order.description,
                senderAddress: order.senderAddress,
                receiverAddress: order.receiverAddress,
                pictureUrl: order.pictureUrl,
                priceRange: order.priceRange
            }
        });

    } catch (error) {
        console.error('Track error:', error);
        res.status(500).json({ error: 'Server error tracking shipment' });
    }
});

// Get all users (demo endpoint)
app.get('/api/users', (req, res) => {
    try {
        const usersData = readUsersFile();
        
        const usersList = usersData.users.map(user => ({
            name: user.name,
            email: user.email,
            registeredAt: user.registeredAt
        }));

        res.json({
            message: 'All registered users',
            users: usersList
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

// Debug: return the last-written user from users.json (non-sensitive fields only)
app.get('/api/debug/last-user', (req, res) => {
    try {
        // Require API key for access
        const providedKey = (req.headers['x-api-key'] || req.query.api_key || '').toString();
        if (!RND_API_KEY) {
            console.warn('Debug endpoint access attempted but RND_API_KEY not configured');
            return res.status(403).json({ error: 'Debug endpoint not configured' });
        }
        if (!providedKey || providedKey !== RND_API_KEY) {
            console.warn('Unauthorized debug last-user access attempt from', req.ip || req.connection.remoteAddress);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const usersData = readUsersFile();
        const users = Array.isArray(usersData.users) ? usersData.users : [];
        if (users.length === 0) return res.status(404).json({ error: 'No users found' });
        const last = users[users.length - 1];

        // Return sanitized user object (do not expose passwords or hashes)
        const safeUser = Object.assign({}, last);
        delete safeUser.password;
        delete safeUser.passwordHash;

        console.log('Debug last-user: returning last user for', safeUser.email || safeUser.name || '<unknown>');

        return res.json({
            message: 'Last user (most recently registered)',
            user: safeUser
        });
    } catch (error) {
        console.error('Debug last-user error:', error);
        res.status(500).json({ error: 'Server error reading users' });
    }
});

// Get all orders (admin endpoint)
app.get('/api/orders', (req, res) => {
    try {
        const ordersData = readOrdersFile();
        res.json({
            message: 'All orders',
            orders: ordersData.orders || []
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// Get all notifications (admin endpoint)
app.get('/api/all-notifications', (req, res) => {
    try {
        const notificationsData = readNotificationsFile();
        const allNotifications = [];

        // Flatten all notifications with email info
        Object.entries(notificationsData.notifications).forEach(([email, notifications]) => {
            notifications.forEach(notif => {
                allNotifications.push({
                    ...notif,
                    userEmail: email
                });
            });
        });

        res.json({
            message: 'All notifications',
            notifications: notificationsData.notifications || {}
        });
    } catch (error) {
        console.error('Get all notifications error:', error);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date() });
});

// Express error handler (will catch errors passed to next(err))
app.use((err, req, res, next) => {
    console.error('Express error handler caught:', err && err.stack ? err.stack : err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: err && err.message ? err.message : 'Server error' });
});

// Global process handlers to log uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
    // optionally exit or attempt graceful shutdown
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Catch-all route - redirect to index.html for any undefined routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`LogiFlow Server running on http://localhost:${PORT}`);
    console.log('Email service configured for:', EMAIL_USER || 'not-set');
    console.log('Using JSON file storage (MongoDB disabled)');
    
    // Connect to MongoDB - DISABLED
    // await connectMongoDB();
});
