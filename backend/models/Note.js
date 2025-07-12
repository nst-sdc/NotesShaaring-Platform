const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  summary: {                        
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pageCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  downloadedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  likedBy: [ 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
    difficulty: {
    type: String,
    enum: ["Basic", "Intermediate", "Advanced"],
    default: "Basic"
  },
  validationStatus: {
    type: String,
    enum: ["pending", "validated", "rejected"],
    default: "pending"
  },
  validationFeedback: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

noteSchema.index({
  title: 'text',
  subject: 'text',
  description: 'text'
});

noteSchema.virtual('likes').get(function () {
  return this.likedBy.length;
});

noteSchema.set('toJSON', { virtuals: true });
noteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Note', noteSchema);