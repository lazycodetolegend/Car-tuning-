const express = require('express');
const Tuning = require('../models/Tuning');
const Car = require('../models/Car');
const { protect, checkOwnership } = require('../middleware/auth');
const { validateTuning, validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');
const { calculateTuningScore } = require('../utils/helpers');

const router = express.Router();

// @desc    Get all tunings
// @route   GET /api/tuning
// @access  Public
router.get('/', [validatePagination, validateSearch], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const options = {
      car: req.query.car,
      user: req.query.user,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      isPublic: true,
      isTemplate: false,
      limit,
      skip,
      sortBy,
      sortOrder
    };

    const tunings = await Tuning.searchTunings(req.query.q, options);
    const total = await Tuning.countDocuments({ isActive: true, isPublic: true });

    res.status(200).json({
      success: true,
      count: tunings.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      data: tunings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get featured tunings
// @route   GET /api/tuning/featured
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const tunings = await Tuning.find({
      isActive: true,
      isPublic: true,
      isTemplate: false
    })
    .populate('user', 'username firstName lastName avatar')
    .populate('car', 'name brand model year images')
    .sort({ views: -1, 'likes': -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      count: tunings.length,
      data: tunings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get tuning templates
// @route   GET /api/tuning/templates
// @access  Public
router.get('/templates', [validatePagination], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tunings = await Tuning.find({
      isActive: true,
      isPublic: true,
      isTemplate: true
    })
    .populate('user', 'username firstName lastName avatar')
    .populate('car', 'name brand model year images')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    const total = await Tuning.countDocuments({
      isActive: true,
      isPublic: true,
      isTemplate: true
    });

    res.status(200).json({
      success: true,
      count: tunings.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      data: tunings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get tuning by ID
// @route   GET /api/tuning/:id
// @access  Public
router.get('/:id', [validateObjectId()], async (req, res, next) => {
  try {
    const tuning = await Tuning.findById(req.params.id)
      .populate('user', 'username firstName lastName avatar')
      .populate('car', 'name brand model year images model3D');

    if (!tuning || !tuning.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    // Check if user can view this tuning
    if (!tuning.isPublic && (!req.user || tuning.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment views
    await tuning.incrementViews();

    res.status(200).json({
      success: true,
      data: tuning
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new tuning
// @route   POST /api/tuning
// @access  Private
router.post('/', [protect, validateTuning], async (req, res, next) => {
  try {
    // Verify car exists
    const car = await Car.findById(req.body.car);
    if (!car || !car.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Add user and calculate performance stats
    req.body.user = req.user.id;
    req.body.performanceStats = {
      originalHorsepower: car.specifications.horsepower,
      originalTorque: car.specifications.torque,
      originalWeight: car.specifications.weight,
      originalAcceleration: car.specifications.acceleration,
      originalTopSpeed: car.specifications.topSpeed
    };

    const tuning = await Tuning.create(req.body);

    // Calculate tuning score
    const score = calculateTuningScore(tuning);
    tuning.tuningScore = score;
    await tuning.save();

    const populatedTuning = await Tuning.findById(tuning._id)
      .populate('user', 'username firstName lastName avatar')
      .populate('car', 'name brand model year images');

    res.status(201).json({
      success: true,
      data: populatedTuning
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update tuning
// @route   PUT /api/tuning/:id
// @access  Private
router.put('/:id', [protect, validateObjectId(), checkOwnership(Tuning)], async (req, res, next) => {
  try {
    const tuning = await Tuning.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('user', 'username firstName lastName avatar')
    .populate('car', 'name brand model year images');

    if (!tuning) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    // Recalculate tuning score
    const score = calculateTuningScore(tuning);
    tuning.tuningScore = score;
    await tuning.save();

    res.status(200).json({
      success: true,
      data: tuning
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete tuning
// @route   DELETE /api/tuning/:id
// @access  Private
router.delete('/:id', [protect, validateObjectId(), checkOwnership(Tuning)], async (req, res, next) => {
  try {
    const tuning = await Tuning.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!tuning) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tuning deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Like/Unlike tuning
// @route   POST /api/tuning/:id/like
// @access  Private
router.post('/:id/like', [protect, validateObjectId()], async (req, res, next) => {
  try {
    const tuning = await Tuning.findById(req.params.id);

    if (!tuning || !tuning.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    const existingLike = tuning.likes.find(
      like => like.user.toString() === req.user.id
    );

    if (existingLike) {
      await tuning.removeLike(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Tuning unliked',
        liked: false,
        likeCount: tuning.likes.length
      });
    } else {
      await tuning.addLike(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Tuning liked',
        liked: true,
        likeCount: tuning.likes.length
      });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Add comment to tuning
// @route   POST /api/tuning/:id/comments
// @access  Private
router.post('/:id/comments', [protect, validateObjectId()], async (req, res, next) => {
  try {
    const tuning = await Tuning.findById(req.params.id);

    if (!tuning || !tuning.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    if (!tuning.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on private tuning'
      });
    }

    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    await tuning.addComment(req.user.id, text.trim());

    const updatedTuning = await Tuning.findById(tuning._id)
      .populate('comments.user', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: updatedTuning.comments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get tuning comments
// @route   GET /api/tuning/:id/comments
// @access  Public
router.get('/:id/comments', [validateObjectId(), validatePagination], async (req, res, next) => {
  try {
    const tuning = await Tuning.findById(req.params.id).select('comments');

    if (!tuning || !tuning.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    if (!tuning.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot view comments on private tuning'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = tuning.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: comments.length,
      total: tuning.comments.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(tuning.comments.length / limit),
        hasNextPage: page < Math.ceil(tuning.comments.length / limit),
        hasPrevPage: page > 1
      },
      data: comments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Share tuning
// @route   POST /api/tuning/:id/share
// @access  Private
router.post('/:id/share', [protect, validateObjectId()], async (req, res, next) => {
  try {
    const tuning = await Tuning.findById(req.params.id);

    if (!tuning || !tuning.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    if (!tuning.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot share private tuning'
      });
    }

    const { platform } = req.body;

    tuning.shares.push({
      user: req.user.id,
      platform: platform || 'other'
    });

    await tuning.save();

    res.status(200).json({
      success: true,
      message: 'Tuning shared successfully',
      shareCount: tuning.shares.length
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get similar tunings
// @route   GET /api/tuning/:id/similar
// @access  Public
router.get('/:id/similar', [validateObjectId()], async (req, res, next) => {
  try {
    const tuning = await Tuning.findById(req.params.id)
      .populate('car', 'brand category tags');

    if (!tuning || !tuning.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    const similarTunings = await Tuning.find({
      _id: { $ne: tuning._id },
      isActive: true,
      isPublic: true,
      $or: [
        { car: tuning.car._id },
        { tags: { $in: tuning.tags } },
        { 'car.brand': tuning.car.brand },
        { 'car.category': tuning.car.category }
      ]
    })
    .populate('user', 'username firstName lastName avatar')
    .populate('car', 'name brand model year images')
    .sort({ views: -1 })
    .limit(6);

    res.status(200).json({
      success: true,
      count: similarTunings.length,
      data: similarTunings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Clone tuning as template
// @route   POST /api/tuning/:id/clone
// @access  Private
router.post('/:id/clone', [protect, validateObjectId()], async (req, res, next) => {
  try {
    const originalTuning = await Tuning.findById(req.params.id);

    if (!originalTuning || !originalTuning.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Tuning not found'
      });
    }

    if (!originalTuning.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot clone private tuning'
      });
    }

    // Create new tuning based on original
    const clonedTuning = new Tuning({
      user: req.user.id,
      car: originalTuning.car,
      name: `${originalTuning.name} (Clone)`,
      description: `Cloned from ${originalTuning.name}`,
      customizations: originalTuning.customizations,
      performanceStats: originalTuning.performanceStats,
      isPublic: false, // Clone is private by default
      isTemplate: false,
      tags: [...originalTuning.tags, 'cloned']
    });

    await clonedTuning.save();

    const populatedTuning = await Tuning.findById(clonedTuning._id)
      .populate('user', 'username firstName lastName avatar')
      .populate('car', 'name brand model year images');

    res.status(201).json({
      success: true,
      message: 'Tuning cloned successfully',
      data: populatedTuning
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get tuning statistics
// @route   GET /api/tuning/stats
// @access  Public
router.get('/stats/overview', async (req, res, next) => {
  try {
    const [
      totalTunings,
      publicTunings,
      templates,
      totalLikes,
      totalViews,
      topTags
    ] = await Promise.all([
      Tuning.countDocuments({ isActive: true }),
      Tuning.countDocuments({ isActive: true, isPublic: true }),
      Tuning.countDocuments({ isActive: true, isTemplate: true }),
      Tuning.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } }
      ]),
      Tuning.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Tuning.aggregate([
        { $match: { isActive: true, isPublic: true } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTunings,
        publicTunings,
        templates,
        totalLikes: totalLikes[0]?.totalLikes || 0,
        totalViews: totalViews[0]?.totalViews || 0,
        topTags: topTags.map(tag => ({ name: tag._id, count: tag.count }))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
