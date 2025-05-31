import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://accounts.google.com'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// In-memory storage for connected users
// In a production app, this would be a database
const connectedUsers = [];

// Configure OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Log OAuth configuration
console.log('OAuth Configuration:');
console.log('REDIRECT_URI:', process.env.REDIRECT_URI);
console.log('Client ID configured:', !!process.env.GOOGLE_CLIENT_ID);
console.log('Client Secret configured:', !!process.env.GOOGLE_CLIENT_SECRET);

// Generate a URL for Gmail authentication
app.get('/api/auth/gmail/url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Always prompt for consent to ensure refresh token is returned
    include_granted_scopes: true
  });

  console.log('Generated Auth URL:', url);
  res.json({ url });
});

// Handle OAuth callback
app.post('/api/auth/gmail/callback', async (req, res) => {
  const { code } = req.body;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    const userInfo = await oauth2.userinfo.get();
    
    // Store the user and their tokens
    const user = {
      id: userInfo.data.id,
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      connectedAt: new Date().toISOString(),
      lastSynced: null
    };
    
    // Check if user already exists and update
    const existingUserIndex = connectedUsers.findIndex(u => u.id === user.id);
    if (existingUserIndex !== -1) {
      connectedUsers[existingUserIndex] = {
        ...connectedUsers[existingUserIndex],
        ...user,
        // Preserve refresh token if not provided in new tokens
        refreshToken: tokens.refresh_token || connectedUsers[existingUserIndex].refreshToken
      };
    } else {
      connectedUsers.push(user);
    }
    
    res.json({ success: true, user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ success: false, error: 'Failed to authenticate with Gmail' });
  }
});

// Check if user is connected
app.get('/api/auth/status', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const user = connectedUsers.find(u => u.email === email);
  if (!user) {
    return res.json({ connected: false });
  }
  
  return res.json({ 
    connected: true, 
    name: user.name,
    email: user.email,
    picture: user.picture,
    connectedAt: user.connectedAt,
    expiryDate: user.expiryDate,
    lastSynced: user.lastSynced
  });
});

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  try {
    const token = req.cookies.admin_token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { secretKey } = req.body;
  
  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Invalid secret key' });
  }
  
  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  res.cookie('admin_token', token, { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000 // 1 hour
  });
  
  res.json({ success: true });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

// Get all connected users (admin only)
app.get('/api/admin/users', adminAuth, (req, res) => {
  // Return user information without sensitive tokens
  const users = connectedUsers.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    connectedAt: user.connectedAt,
    expiryDate: user.expiryDate,
    lastSynced: user.lastSynced
  }));
  
  res.json({ users });
});

// Trigger sync for a user (admin only)
app.post('/api/admin/users/:id/sync', adminAuth, async (req, res) => {
  const { id } = req.params;
  const user = connectedUsers.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  try {
    // Set up OAuth client with user's tokens
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
      expiry_date: user.expiryDate
    });
    
    // Check if token refresh is needed
    if (Date.now() > user.expiryDate) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      user.accessToken = credentials.access_token;
      user.expiryDate = credentials.expiry_date;
    }
    
    // Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get messages from inbox (limited to 10 for demo purposes)
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10
    });
    
    // Update last synced timestamp
    const userIndex = connectedUsers.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      connectedUsers[userIndex].lastSynced = new Date().toISOString();
    }
    
    res.json({ 
      success: true, 
      messageCount: response.data.messages ? response.data.messages.length : 0,
      lastSynced: connectedUsers[userIndex].lastSynced
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync with Gmail' });
  }
});

// Revoke a user's connection (admin only)
app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const userIndex = connectedUsers.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  try {
    // Revoke access token
    await oauth2Client.revokeToken(connectedUsers[userIndex].accessToken);
    
    // Remove user from connected users
    connectedUsers.splice(userIndex, 1);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Revoke error:', error);
    // Even if there's an API error, remove the user from our storage
    connectedUsers.splice(userIndex, 1);
    res.json({ success: true, warning: 'User removed but token revocation may have failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});