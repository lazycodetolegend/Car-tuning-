const express = require('express');
const User = require('../models/User');
const Tuning = require('../models/Tuning');
const Project = require('../models/Project');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', [protect, authorize('admin'), validatePagination], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({ isActive: true })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', [protect, validateObjectId()], async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow users to view their own profile or admins to view any profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', [protect, validateObjectId()], async (req, res, next) => {
  try {
    // Only allow users to update their own profile or admins to update any profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const allowedFields = ['firstName', 'lastName', 'avatar', 'preferences'];
    const updateFields = {};

    // Only include allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin'), validateObjectId()], async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's tunings
// @route   GET /api/users/:id/tunings
// @access  Private
router.get('/:id/tunings', [protect, validateObjectId(), validatePagination], async (req, res, next) => {
  try {
    // Only allow users to view their own tunings or admins to view any tunings
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const isPublic = req.query.public === 'true';

    const query = { 
      user: req.params.id, 
      isActive: true 
    };

    if (isPublic) {
      query.isPublic = true;
    }

    const tunings = await Tuning.find(query)
      .populate('car', 'name brand model year images')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Tuning.countDocuments(query);

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

// @desc    Get user's projects
// @route   GET /api/users/:id/projects
// @access  Private
router.get('/:id/projects', [protect, validateObjectId(), validatePagination], async (req, res, next) => {
  try {
    // Only allow users to view their own projects or admins to view any projects
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const isPublic = req.query.public === 'true';

    const query = { 
      user: req.params.id, 
      isActive: true 
    };

    if (isPublic) {
      query.isPublic = true;
    }

    const projects = await Project.find(query)
      .populate('tunings', 'name car images')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      data: projects
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's liked tunings
// @route   GET /api/users/:id/likes
// @access  Private
router.get('/:id/likes', [protect, validateObjectId(), validatePagination], async (req, res, next) => {
  try {
    // Only allow users to view their own likes or admins to view any likes
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tunings = await Tuning.find({
      'likes.user': req.params.id,
      isActive: true,
      isPublic: true
    })
    .populate('user', 'username firstName lastName avatar')
    .populate('car', 'name brand model year images')
    .sort({ 'likes.likedAt': -1 })
    .limit(limit)
    .skip(skip);

    const total = await Tuning.countDocuments({
      'likes.user': req.params.id,
      isActive: true,
      isPublic: true
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

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private
router.get('/:id/stats', [protect, validateObjectId()], async (req, res, next) => {
  try {
    // Only allow users to view their own stats or admins to view any stats
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [
      totalTunings,
      publicTunings,
      totalProjects,
      publicProjects,
      totalLikes,
      totalViews
    ] = await Promise.all([
      Tuning.countDocuments({ user: req.params.id, isActive: true }),
      Tuning.countDocuments({ user: req.params.id, isActive: true, isPublic: true }),
      Project.countDocuments({ user: req.params.id, isActive: true }),
      Project.countDocuments({ user: req.params.id, isActive: true, isPublic: true }),
      Tuning.aggregate([
        { $match: { user: req.params.id, isActive: true } },
        { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } }
      ]),
      Tuning.aggregate([
        { $match: { user: req.params.id, isActive: true } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        tunings: {
          total: totalTunings,
          public: publicTunings,
          private: totalTunings - publicTunings
        },
        projects: {
          total: totalProjects,
          public: publicProjects,
          private: totalProjects - publicProjects
        },
        engagement: {
          totalLikes: totalLikes[0]?.totalLikes || 0,
          totalViews: totalViews[0]?.totalViews || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's activity feed
// @route   GET /api/users/:id/activity
// @access  Private
router.get('/:id/activity', [protect, validateObjectId(), validatePagination], async (req, res, next) => {
  try {
    // Only allow users to view their own activity or admins to view any activity
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get recent tunings and projects
    const [recentTunings, recentProjects] = await Promise.all([
      Tuning.find({ user: req.params.id, isActive: true })
        .populate('car', 'name brand model year images')
        .sort({ createdAt: -1 })
        .limit(limit / 2)
        .skip(skip / 2),
      Project.find({ user: req.params.id, isActive: true })
        .populate('tunings', 'name car images')
        .sort({ createdAt: -1 })
        .limit(limit / 2)
        .skip(skip / 2)
    ]);

    // Combine and sort by date
    const activity = [
      ...recentTunings.map(tuning => ({
        type: 'tuning',
        data: tuning,
        date: tuning.createdAt
      })),
      ...recentProjects.map(project => ({
        type: 'project',
        data: project,
        date: project.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      count: activity.length,
      data: activity
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all users statistics (Admin only)
// @route   GET /api/users/admin/stats
// @access  Private (Admin only)
router.get('/admin/stats', [protect, authorize('admin')], async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      newUsersThisMonth,
      userStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      User.aggregate([
        {
          $group: {
            _id: null,
            avgTunings: { $avg: '$tunings' },
            avgProjects: { $avg: '$projects' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        newUsersThisMonth,
        userStats: userStats[0] || { avgTunings: 0, avgProjects: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
