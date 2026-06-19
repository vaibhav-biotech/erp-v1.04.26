const mongoose = require('mongoose');

const CALL_OUTCOMES = ['answered', 'no_answer', 'busy', 'wrong_number', 'callback', 'converted', 'create_order'];

const staffCallLogRecordSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    contactId: { type: String, required: true, trim: true, index: true },
    staffId: { type: String, required: true, trim: true, index: true },
    calledAt: { type: String, required: true, trim: true },
    outcome: { type: String, enum: CALL_OUTCOMES, required: true },
    orderStoreId: { type: String, trim: true },
    durationMinutes: { type: Number },
    notes: { type: String, default: '' },
    storeName: { type: String, lowercase: true, default: 'plantsingarden', index: true },
  },
  {
    timestamps: true,
    collection: 'staff_call_logs',
  }
);

staffCallLogRecordSchema.methods.toClientJSON = function () {
  return {
    id: this.id,
    contactId: this.contactId,
    staffId: this.staffId,
    calledAt: this.calledAt,
    outcome: this.outcome,
    orderStoreId: this.orderStoreId || undefined,
    durationMinutes: this.durationMinutes,
    notes: this.notes || undefined,
  };
};

module.exports = mongoose.model('StaffCallLogRecord', staffCallLogRecordSchema);
