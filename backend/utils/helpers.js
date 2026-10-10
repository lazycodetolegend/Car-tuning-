const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences
      }
    });
};

// Send email
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  const info = await transporter.sendMail(message);
  console.log('Message sent: %s', info.messageId);
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash string
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file type
const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.mimetype);
};

// Generate slug from string
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Calculate pagination
const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

// Sanitize HTML
const sanitizeHtml = (html) => {
  // Basic HTML sanitization - in production, use a proper library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Validate color hex
const validateHexColor = (hex) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};

// Convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Convert RGB to hex
const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Calculate performance gains
const calculatePerformanceGains = (modifications) => {
  let totalHpGain = 0;
  let totalTorqueGain = 0;
  let totalWeightChange = 0;

  modifications.forEach(mod => {
    if (mod.performanceGain) {
      totalHpGain += mod.performanceGain.horsepower || 0;
      totalTorqueGain += mod.performanceGain.torque || 0;
      totalWeightChange += mod.performanceGain.weight || 0;
    }
  });

  return {
    horsepower: totalHpGain,
    torque: totalTorqueGain,
    weight: totalWeightChange
  };
};

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = generateRandomString(8);
  const extension = originalName.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Validate 3D model file
const validate3DModelFile = (file) => {
  const allowedTypes = [
    'model/gltf-binary',
    'model/gltf+json',
    'application/octet-stream'
  ];
  
  const allowedExtensions = ['.glb', '.gltf', '.fbx', '.obj'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  return allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension);
};

// Calculate tuning score
const calculateTuningScore = (tuning) => {
  let score = 0;
  
  // Base score for having a tuning
  score += 10;
  
  // Paint customizations
  if (tuning.customizations.paint && tuning.customizations.paint.length > 0) {
    score += tuning.customizations.paint.length * 5;
  }
  
  // Performance modifications
  const perf = tuning.customizations.performance;
  if (perf.engine.turbo.installed) score += 20;
  if (perf.engine.ecu.tuned) score += 15;
  if (perf.engine.intake.upgraded) score += 10;
  if (perf.engine.exhaust.upgraded) score += 10;
  if (perf.suspension.lowered) score += 10;
  if (perf.brakes.upgraded) score += 10;
  
  // Exterior modifications
  if (perf.exterior.bodyKit.installed) score += 15;
  if (perf.exterior.spoiler.installed) score += 10;
  if (perf.exterior.lights.headlights.upgraded) score += 5;
  if (perf.exterior.lights.taillights.upgraded) score += 5;
  
  // Interior modifications
  if (perf.interior.seats.upgraded) score += 10;
  if (perf.interior.steeringWheel.upgraded) score += 5;
  if (perf.interior.dashboard.upgraded) score += 5;
  
  return Math.min(score, 100); // Cap at 100
};

module.exports = {
  sendTokenResponse,
  sendEmail,
  generateRandomString,
  hashString,
  formatFileSize,
  validateFileType,
  generateSlug,
  calculatePagination,
  sanitizeHtml,
  validateHexColor,
  hexToRgb,
  rgbToHex,
  calculatePerformanceGains,
  formatCurrency,
  generateUniqueFilename,
  validate3DModelFile,
  calculateTuningScore
};
