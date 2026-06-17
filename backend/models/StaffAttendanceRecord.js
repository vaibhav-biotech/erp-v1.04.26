const mongoose = require('mongoose');

const staffAttendanceRecordSchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, trim: true, index: true },
    date: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'holiday', 'leave', 'half_day'],
      required: true,
    },
    storeName: { type: String, lowercase: true, default: 'plantsingarden', index: true },
  },
  {
    timestamps: true,
    collection: 'staff_attendance',
  }
);

staffAttendanceRecordSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('StaffAttendanceRecord', staffAttendanceRecordSchema);
