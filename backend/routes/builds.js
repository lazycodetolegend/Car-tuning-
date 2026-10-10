const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { body } = require('express-validator');
const Build = require('../models/Build');
const Car = require('../models/Car');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * Generate a clean, short URL-friendly slug for public builds
 */
const generateShareSlug = () => {
  return crypto.randomBytes(5).toString('hex');
};

// @route   POST /api/builds
// @desc    Save a build for the current user
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('car').notEmpty().withMessage('Car reference is required'),
    body('name').optional().trim()
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        car: carRef,
        name,
        paintColors,
        selectedRim,
        extras,
        thumbnailUrl,
        thumbnailPublicId,
        isPublic
      } = req.body;

      // Resolve car reference (can be ObjectId, slug, or model name)
      let carId;
      if (mongoose.Types.ObjectId.isValid(carRef)) {
        const found = await Car.findById(carRef);
        if (found) carId = found._id;
      }

      if (!carId) {
        const found = await Car.findOne({
          $or: [
            { slug: String(carRef).toLowerCase() },
            { model: new RegExp(`^${String(carRef)}$`, 'i') }
          ]
        });
        if (found) carId = found._id;
      }

      if (!carId) {
        return res.status(400).json({
          error: 'Valid car reference not found for this build'
        });
      }

      const shareSlug = generateShareSlug();

      const build = await Build.create({
        user: req.user._id,
        car: carId,
        name: name || 'My Custom Build',
        paintColors: Array.isArray(paintColors) ? paintColors : [],
        selectedRim: selectedRim || '',
        extras: extras || {},
        thumbnailUrl: thumbnailUrl || '',
        thumbnailPublicId: thumbnailPublicId || '',
        isPublic: !!isPublic,
        shareSlug
      });

      const populatedBuild = await Build.findById(build._id).populate(
        'car',
        'brand model year slug images model3D specs'
      );

      res.status(201).json(populatedBuild);
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/builds/mine
// @desc    Get the caller's builds, newest first
// @access  Private
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const builds = await Build.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('car', 'brand model year slug images model3D specs');

    res.status(200).json(builds);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/builds/public/:shareSlug
// @desc    Public read for builds with isPublic === true
// @access  Public
router.get('/public/:shareSlug', async (req, res, next) => {
  try {
    const { shareSlug } = req.params;

    const build = await Build.findOne({
      shareSlug,
      isPublic: true
    })
      .populate('car', 'brand model year slug images model3D specs')
      .populate('user', 'username avatarUrl');

    if (!build) {
      return res.status(404).json({
        error: 'Build not found or is private'
      });
    }

    res.status(200).json(build);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/builds/:id
// @desc    Get single build (Owner only - 404 if it exists but belongs to someone else)
// @access  Private
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Build not found' });
    }

    const build = await Build.findById(req.params.id);

    // Strict ownership verification: return 404 if not found or belongs to someone else
    if (!build || build.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        error: 'Build not found'
      });
    }

    const populatedBuild = await Build.findById(build._id).populate(
      'car',
      'brand model year slug images model3D specs'
    );

    res.status(200).json(populatedBuild);
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/builds/:id
// @desc    Update build (Owner only)
// @access  Private
router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Build not found' });
    }

    const build = await Build.findById(req.params.id);

    if (!build || build.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        error: 'Build not found'
      });
    }

    const updatable = [
      'name',
      'paintColors',
      'selectedRim',
      'extras',
      'thumbnailUrl',
      'thumbnailPublicId',
      'isPublic'
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        build[field] = req.body[field];
      }
    });

    if (build.isPublic && !build.shareSlug) {
      build.shareSlug = generateShareSlug();
    }

    await build.save();

    const populatedBuild = await Build.findById(build._id).populate(
      'car',
      'brand model year slug images model3D specs'
    );

    res.status(200).json(populatedBuild);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/builds/:id
// @desc    Hard delete build (Owner only)
// @access  Private
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Build not found' });
    }

    const build = await Build.findById(req.params.id);

    if (!build || build.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({
        error: 'Build not found'
      });
    }

    await Build.deleteOne({ _id: build._id });

    res.status(200).json({
      message: 'Build deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
