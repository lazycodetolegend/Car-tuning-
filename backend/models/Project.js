const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

projectSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Project', projectSchema);
