const mongoose = require('mongoose');

const buildSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: [true, 'Car reference is required']
    },
    name: {
      type: String,
      default: 'My Build',
      trim: true
    },
    paintColors: [
      {
        materialName: { type: String, required: true },
        hex: { type: String, required: true }
      }
    ],
    selectedRim: {
      type: String,
      default: ''
    },
    extras: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    thumbnailPublicId: {
      type: String,
      default: ''
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },
    shareSlug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast queries of user builds sorted by newest
buildSchema.index({ user: 1, createdAt: -1 });

buildSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Build', buildSchema);
