const express = require('express');
const mongoose = require('mongoose');
const { body, query } = require('express-validator');
const Car = require('../models/Car');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, escapeRegex } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/cars
// @desc    List active cars with filtering & search
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };

    if (req.query.brand) {
      filter.brand = new RegExp(`^${escapeRegex(req.query.brand)}$`, 'i');
    }

    if (req.query.year) {
      const yearNum = parseInt(req.query.year, 10);
      if (!isNaN(yearNum)) {
        filter.year = yearNum;
      }
    }

    if (req.query.search) {
      const escaped = escapeRegex(req.query.search.trim());
      const searchRegex = new RegExp(escaped, 'i');
      filter.$or = [
        { model: searchRegex },
        { brand: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    const sortOption = req.query.sort === 'popularity' ? { popularity: -1 } : { createdAt: -1 };

    // Support pagination
    if (req.query.page || req.query.limit) {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const [cars, total] = await Promise.all([
        Car.find(filter).sort(sortOption).skip(skip).limit(limit),
        Car.countDocuments(filter)
      ]);

      return res.status(200).json({
        cars,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }

    // Default: return list of cars
    const cars = await Car.find(filter).sort(sortOption);
    res.status(200).json(cars);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/cars/:idOrSlug
// @desc    Get single car by Mongo ID or slug, increment popularity fire-and-forget
// @access  Public
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const isId = mongoose.Types.ObjectId.isValid(idOrSlug);

    const query = isId
      ? { _id: idOrSlug, isActive: true }
      : { slug: idOrSlug.toLowerCase(), isActive: true };

    const car = await Car.findOne(query);
    if (!car) {
      return res.status(404).json({
        error: 'Car not found'
      });
    }

    // Fire-and-forget popularity counter
    Car.updateOne({ _id: car._id }, { $inc: { popularity: 1 } }).exec();

    res.status(200).json(car);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/cars/:id/similar
// @desc    Get up to 6 similar cars (same brand)
// @access  Public
router.get('/:id/similar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isId = mongoose.Types.ObjectId.isValid(id);

    const targetCar = isId
      ? await Car.findById(id)
      : await Car.findOne({ slug: id.toLowerCase() });

    if (!targetCar) {
      return res.status(404).json({
        error: 'Car not found'
      });
    }

    const similarCars = await Car.find({
      brand: targetCar.brand,
      _id: { $ne: targetCar._id },
      isActive: true
    })
      .limit(6)
      .sort({ popularity: -1 });

    res.status(200).json(similarCars);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/cars
// @desc    Create new car
// @access  Admin only
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('brand').trim().notEmpty().withMessage('Brand is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: 2100 }).withMessage('Valid year is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
    body('model3D.url').notEmpty().withMessage('3D model URL is required')
  ],
  validate,
  async (req, res, next) => {
    try {
      const existingSlug = await Car.findOne({ slug: req.body.slug.toLowerCase() });
      if (existingSlug) {
        return res.status(409).json({
          error: 'A car with this slug already exists'
        });
      }

      const car = await Car.create(req.body);
      res.status(201).json(car);
    } catch (error) {
      next(error);
    }
  }
);

// @route   PATCH /api/cars/:id
// @desc    Update car
// @access  Admin only
router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.status(200).json(car);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/cars/:id
// @desc    Soft delete car (isActive = false)
// @access  Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Car not found' });
    }

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    car.isActive = false;
    await car.save();

    res.status(200).json({
      message: 'Car successfully deactivated'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
