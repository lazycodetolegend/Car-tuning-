const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// @route   GET /api/health
// @desc    Health check endpoint for Render and uptime monitoring
// @access  Public
router.get('/', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'ok',
    db: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
