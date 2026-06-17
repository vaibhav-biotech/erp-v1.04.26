const mongoose = require('mongoose');

const STAFF_WORK_TYPES = ['social_media', 'whatsapp', 'sales', 'operations'];
const TASK_STATUSES = ['pending', 'in_progress', 'done'];

const staffTaskRecordSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assigneeId: { type: String, required: true, trim: true, index: true },
    workType: { type: String, enum: STAFF_WORK_TYPES, required: true },
    scheduledDate: { type: String, required: true, trim: true, index: true },
    scheduledTime: { type: String, default: '' },
    status: { type: String, enum: TASK_STATUSES, default: 'pending' },
    createdById: { type: String, required: true, trim: true },
    storeName: { type: String, lowercase: true, default: 'plantsingarden', index: true },
  },
  {
    timestamps: true,
    collection: 'staff_tasks',
  }
);

staffTaskRecordSchema.methods.toClientJSON = function () {
  return {
    id: this.id,
    title: this.title,
    description: this.description || undefined,
    assigneeId: this.assigneeId,
    workType: this.workType,
    scheduledDate: this.scheduledDate,
    scheduledTime: this.scheduledTime || undefined,
    status: this.status,
    createdById: this.createdById,
  };
};

module.exports = mongoose.model('StaffTaskRecord', staffTaskRecordSchema);
