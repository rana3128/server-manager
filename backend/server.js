require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Serve static files from React build (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lightsail Manager API running on port ${PORT}`);
  console.log(`📡 SSH Host: ${process.env.LIGHTSAIL_HOST}`);
  console.log(`👤 SSH User: ${process.env.LIGHTSAIL_USER}`);
  console.log(`🔑 SSH Key: ${process.env.LIGHTSAIL_KEY_PATH}`);
  console.log(`📦 Projects configured: ${process.env.PROJECTS ? process.env.PROJECTS.split(',').length : 0}`);
});

module.exports = app;
