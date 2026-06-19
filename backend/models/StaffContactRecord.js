const mongoose = require('mongoose');

const CONTACT_STATUSES = ['new', 'contacted', 'callback', 'interested', 'not_interested'];

const staffContactRecordSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true },
    notes: { type: String, default: '' },
    status: { type: String, enum: CONTACT_STATUSES, default: 'new' },
    assignedToId: { type: String, required: true, trim: true, index: true },
    createdAtDate: { type: String, required: true, trim: true }, // Store yyyy-mm-dd as string to match existing logic
    source: { type: String, enum: ['manual', 'bulk_upload'], default: 'manual' },
    storeName: { type: String, lowercase: true, default: 'plantsingarden', index: true },
  },
  {
    timestamps: true,
    collection: 'staff_contacts',
  }
);

staffContactRecordSchema.methods.toClientJSON = function () {
  return {
    id: this.id,
    name: this.name,
    phone: this.phone,
    email: this.email || undefined,
    city: this.city || undefined,
    notes: this.notes || undefined,
    status: this.status,
    assignedToId: this.assignedToId,
    createdAt: this.createdAtDate, // Mapped back to createdAt
    source: this.source,
  };
};

module.exports = mongoose.model('StaffContactRecord', staffContactRecordSchema);
