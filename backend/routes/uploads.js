const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cloudinaryConfig = require('../config/cloudinary');
const { authenticate } = require('../middleware/auth');
const Build = require('../models/Build');
const User = require('../models/User');

const router = express.Router();

// Configure Multer with memory storage and strict file filter
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

// @route   POST /api/uploads/image
// @desc    Process image with Sharp and upload to Cloudinary
// @access  Private
router.post(
  '/image',
  authenticate,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Please upload an image file (field name: image)'
        });
      }

      // Process image through sharp: resize to max 1600px width, convert to webp quality 82
      const processedBuffer = await sharp(req.file.buffer)
        .resize({
          width: 1600,
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 82 })
        .toBuffer();

      // Upload buffer directly to Cloudinary
      const result = await cloudinaryConfig.uploadStream(processedBuffer, {
        folder: 'car-tuning/uploads',
        resource_type: 'image'
      });

      res.status(200).json({
        secure_url: result.secure_url,
        public_id: result.public_id
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/uploads/:publicId
// @desc    Delete image from Cloudinary (ownership verification)
// @access  Private
router.delete('/:publicId(*)', authenticate, async (req, res, next) => {
  try {
    const publicId = req.params.publicId;

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' });
    }

    // Verify ownership: check user avatar or user's builds
    let isOwner = false;

    if (req.user.role === 'admin') {
      isOwner = true;
    } else {
      const userHasAvatar = req.user.avatarUrl && req.user.avatarUrl.includes(publicId);
      if (userHasAvatar) {
        isOwner = true;
      } else {
        const buildWithThumb = await Build.findOne({
          user: req.user._id,
          thumbnailPublicId: publicId
        });
        if (buildWithThumb) {
          isOwner = true;
        }
      }
    }

    if (!isOwner) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to delete this asset'
      });
    }

    await cloudinaryConfig.deleteImage(publicId);

    res.status(200).json({
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
