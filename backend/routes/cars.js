const express = require('express');
const Car = require('../models/Car');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validateCar, validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
router.get('/', [validatePagination, validateSearch], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'popularity';
    const sortOrder = req.query.sortOrder || 'desc';

    const options = {
      brand: req.query.brand,
      category: req.query.category,
      year: req.query.year,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      limit,
      skip,
      sortBy,
      sortOrder
    };

    const cars = await Car.searchCars(req.query.q, options);
    const total = await Car.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      count: cars.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      data: cars
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get featured cars
// @route   GET /api/cars/featured
// @access  Public
router.get('/featured', async (req, res, next) => {
  try {
    const cars = await Car.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .populate('createdBy', 'username firstName lastName')
    .sort({ popularity: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car by ID
// @route   GET /api/cars/:id
// @access  Public
router.get('/:id', [validateObjectId(), optionalAuth], async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName avatar');

    if (!car || !car.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Increment popularity if user is authenticated
    if (req.user) {
      await car.incrementPopularity();
    }

    res.status(200).json({
      success: true,
      data: car
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new car
// @route   POST /api/cars
// @access  Private (Admin only)
router.post('/', [protect, authorize('admin'), validateCar], async (req, res, next) => {
  try {
    // Add createdBy field
    req.body.createdBy = req.user.id;

    const car = await Car.create(req.body);

    res.status(201).json({
      success: true,
      data: car
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private (Admin only)
router.put('/:id', [protect, authorize('admin'), validateObjectId(), validateCar], async (req, res, next) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    res.status(200).json({
      success: true,
      data: car
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin'), validateObjectId()], async (req, res, next) => {
  try {
    const car = await Car.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car categories
// @route   GET /api/cars/categories
// @access  Public
router.get('/meta/categories', async (req, res, next) => {
  try {
    const categories = await Car.distinct('category', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car brands
// @route   GET /api/cars/brands
// @access  Public
router.get('/meta/brands', async (req, res, next) => {
  try {
    const brands = await Car.distinct('brand', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car years
// @route   GET /api/cars/years
// @access  Public
router.get('/meta/years', async (req, res, next) => {
  try {
    const years = await Car.distinct('year', { isActive: true }).sort({ year: -1 });
    
    res.status(200).json({
      success: true,
      data: years
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car tags
// @route   GET /api/cars/tags
// @access  Public
router.get('/meta/tags', async (req, res, next) => {
  try {
    const tags = await Car.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);
    
    res.status(200).json({
      success: true,
      data: tags.map(tag => ({ name: tag._id, count: tag.count }))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get similar cars
// @route   GET /api/cars/:id/similar
// @access  Public
router.get('/:id/similar', [validateObjectId()], async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car || !car.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    const similarCars = await Car.find({
      _id: { $ne: car._id },
      isActive: true,
      $or: [
        { brand: car.brand },
        { category: car.category },
        { tags: { $in: car.tags } }
      ]
    })
    .populate('createdBy', 'username firstName lastName')
    .sort({ popularity: -1 })
    .limit(6);

    res.status(200).json({
      success: true,
      count: similarCars.length,
      data: similarCars
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car tuning parts
// @route   GET /api/cars/:id/parts
// @access  Public
router.get('/:id/parts', [validateObjectId()], async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id).select('tuningParts');
    
    if (!car || !car.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    const category = req.query.category;
    let parts = car.tuningParts;

    if (category) {
      parts = parts.filter(part => part.category === category);
    }

    res.status(200).json({
      success: true,
      count: parts.length,
      data: parts
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car rims
// @route   GET /api/cars/:id/rims
// @access  Public
router.get('/:id/rims', [validateObjectId()], async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id).select('rims');
    
    if (!car || !car.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    const brand = req.query.brand;
    let rims = car.rims;

    if (brand) {
      rims = rims.filter(rim => 
        rim.brand.toLowerCase().includes(brand.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      count: rims.length,
      data: rims
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get car statistics
// @route   GET /api/cars/stats
// @access  Private (Admin only)
router.get('/admin/stats', [protect, authorize('admin')], async (req, res, next) => {
  try {
    const stats = await Car.aggregate([
      {
        $group: {
          _id: null,
          totalCars: { $sum: 1 },
          activeCars: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          featuredCars: {
            $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
          },
          avgPopularity: { $avg: '$popularity' },
          totalViews: { $sum: '$popularity' }
        }
      }
    ]);

    const categoryStats = await Car.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const brandStats = await Car.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalCars: 0,
          activeCars: 0,
          featuredCars: 0,
          avgPopularity: 0,
          totalViews: 0
        },
        categories: categoryStats,
        topBrands: brandStats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
