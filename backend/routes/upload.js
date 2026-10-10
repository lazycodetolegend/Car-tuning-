const express = require('express');
const multer = require('multer');
const path = require('path');
const { storage } = require('../config/firebase');
const { protect, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedModelTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    
    if (file.fieldname.includes('Image') || file.fieldname === 'avatar') {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
      }
    } else if (file.fieldname.includes('Model')) {
      if (allowedModelTypes.includes(file.mimetype) || 
          file.originalname.toLowerCase().endsWith('.glb') ||
          file.originalname.toLowerCase().endsWith('.gltf')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid 3D model file type. Only GLB and GLTF are allowed.'), false);
      }
    } else {
      cb(new Error('Invalid file field'), false);
    }
  }
});

// Upload to Firebase Storage
const uploadToFirebaseStorage = async (file, folder = 'uploads') => {
  try {
    const bucket = storage.bucket();
    const fileName = `${folder}/${uuidv4()}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', async () => {
        try {
          // Make the file publicly accessible
          await fileUpload.makePublic();
          
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
          
          resolve({
            url: publicUrl,
            fileName: fileName,
            size: file.size,
            mimetype: file.mimetype
          });
        } catch (error) {
          reject(error);
        }
      });
      
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Failed to upload to Firebase Storage: ${error.message}`);
  }
};

// Optimize image before upload
const optimizeImage = async (buffer, mimetype) => {
  try {
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      return await sharp(buffer)
        .jpeg({ quality: 80 })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } else if (mimetype === 'image/png') {
      return await sharp(buffer)
        .png({ quality: 80 })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    } else if (mimetype === 'image/webp') {
      return await sharp(buffer)
        .webp({ quality: 80 })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
    
    return buffer;
  } catch (error) {
    console.warn('Image optimization failed, using original:', error.message);
    return buffer;
  }
};

// @desc    Upload avatar
// @route   POST /api/upload/avatar
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Optimize image
    const optimizedBuffer = await optimizeImage(req.file.buffer, req.file.mimetype);
    req.file.buffer = optimizedBuffer;

    const result = await uploadToFirebaseStorage(req.file, `avatars/${req.user.id}`);
    
    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: result.url,
        fileName: result.fileName,
        size: result.size
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload car images
// @route   POST /api/upload/car-images
// @access  Private (Admin only)
router.post('/car-images', [protect, authorize('admin'), upload.array('carImages', 10)], async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const optimizedBuffer = await optimizeImage(file.buffer, file.mimetype);
      file.buffer = optimizedBuffer;
      return uploadToFirebaseStorage(file, 'cars/images');
    });

    const results = await Promise.all(uploadPromises);
    
    res.status(200).json({
      success: true,
      message: `${results.length} car images uploaded successfully`,
      data: results.map(result => ({
        url: result.url,
        fileName: result.fileName,
        size: result.size
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload car 3D model
// @route   POST /api/upload/car-model
// @access  Private (Admin only)
router.post('/car-model', [protect, authorize('admin'), upload.single('carModel')], async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await uploadToFirebaseStorage(req.file, 'cars/models');
    
    res.status(200).json({
      success: true,
      message: 'Car model uploaded successfully',
      data: {
        url: result.url,
        fileName: result.fileName,
        size: result.size,
        format: path.extname(req.file.originalname).toLowerCase().slice(1)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload rim model
// @route   POST /api/upload/rim-model
// @access  Private (Admin only)
router.post('/rim-model', [protect, authorize('admin'), upload.single('rimModel')], async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const result = await uploadToFirebaseStorage(req.file, 'rims/models');
    
    res.status(200).json({
      success: true,
      message: 'Rim model uploaded successfully',
      data: {
        url: result.url,
        fileName: result.fileName,
        size: result.size,
        format: path.extname(req.file.originalname).toLowerCase().slice(1)
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload tuning images
// @route   POST /api/upload/tuning-images
// @access  Private
router.post('/tuning-images', [protect, upload.array('tuningImages', 5)], async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const optimizedBuffer = await optimizeImage(file.buffer, file.mimetype);
      file.buffer = optimizedBuffer;
      return uploadToFirebaseStorage(file, `tunings/${req.user.id}`);
    });

    const results = await Promise.all(uploadPromises);
    
    res.status(200).json({
      success: true,
      message: `${results.length} tuning images uploaded successfully`,
      data: results.map(result => ({
        url: result.url,
        fileName: result.fileName,
        size: result.size
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete file from Firebase Storage
// @route   DELETE /api/upload/:fileName
// @access  Private
router.delete('/:fileName', protect, async (req, res, next) => {
  try {
    const { fileName } = req.params;
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    // Check if user owns the file or is admin
    if (!fileName.includes(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own files.'
      });
    }
    
    await file.delete();
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    if (error.code === 404) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    next(error);
  }
});

// @desc    Get upload statistics
// @route   GET /api/upload/stats
// @access  Private (Admin only)
router.get('/stats', [protect, authorize('admin')], async (req, res, next) => {
  try {
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles();

    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      byType: {},
      byFolder: {}
    };

    files.forEach(file => {
      stats.totalSize += file.metadata.size || 0;
      
      // Count by type
      const contentType = file.metadata.contentType || 'unknown';
      stats.byType[contentType] = (stats.byType[contentType] || 0) + 1;

      // Count by folder
      const folder = file.name.split('/')[0];
      stats.byFolder[folder] = (stats.byFolder[folder] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        totalSizeFormatted: formatFileSize(stats.totalSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('Invalid')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
});

module.exports = router;