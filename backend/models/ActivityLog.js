const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  adminEmail: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Prevent updates and deletes (immutable log)
activityLogSchema.pre('findOneAndUpdate', function(next) {
  next(new Error('Activity logs are immutable and cannot be updated'));
});

activityLogSchema.pre('updateOne', function(next) {
  next(new Error('Activity logs are immutable and cannot be updated'));
});

activityLogSchema.pre('remove', function(next) {
  next(new Error('Activity logs are immutable and cannot be deleted'));
});

activityLogSchema.pre('deleteOne', function(next) {
  next(new Error('Activity logs are immutable and cannot be deleted'));
});

activityLogSchema.pre('deleteMany', function(next) {
  next(new Error('Activity logs are immutable and cannot be deleted'));
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
