/**
 * CottonPay Backend Server
 * eSignet OIDC Integration
 */

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const salesRoutes = require('./src/routes/sales');

const app = express();
const PORT = process.env.APP_PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'cottonpay-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/sales', salesRoutes);

// Redirect /callback to /auth/callback
app.get('/callback', (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  res.redirect(`/auth/callback?${queryString}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CottonPay Backend',
    timestamp: new Date().toISOString(),
    esignet_configured: !!process.env.CLIENT_ID
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌾 CottonPay Backend Server                        ║
║                                                       ║
║   Port: ${PORT}                                      ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   eSignet: ${process.env.ESIGNET_BASE_URL}           ║
║                                                       ║
║   Ready to accept requests!                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
