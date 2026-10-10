const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      index: true
    },
    model: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Year is required']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    model3D: {
      url: {
        type: String,
        required: [true, '3D Model URL is required']
      },
      materials: [
        {
          name: { type: String, required: true },
          isPaintable: { type: Boolean, default: true }
        }
      ]
    },
    rims: [
      {
        id: { type: String },
        name: { type: String },
        modelUrl: { type: String },
        isDefault: { type: Boolean, default: false }
      }
    ],
    images: [
      {
        url: { type: String },
        cloudinaryPublicId: { type: String },
        isPrimary: { type: Boolean, default: false }
      }
    ],
    specs: {
      engine: { type: String, default: '' },
      power: { type: String, default: '' },
      torque: { type: String, default: '' },
      zeroToSixty: { type: String, default: '' }
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    popularity: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

carSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Car', carSchema);
