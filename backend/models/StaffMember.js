const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const STAFF_JOB_ROLES = [
  'social_media_manager',
  'whatsapp_manager',
  'sales',
  'operations',
  'packaging',
  'customer_support',
];

const staffMemberSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 4,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['staff', 'staff_admin'],
      required: true,
    },
    jobRoles: {
      type: [String],
      enum: STAFF_JOB_ROLES,
      default: ['operations'],
    },
    avatarInitials: {
      type: String,
      default: '??',
    },
    phone: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    storeName: {
      type: String,
      lowercase: true,
      default: 'plantsingarden',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'staff_members',
  }
);

staffMemberSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

staffMemberSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

staffMemberSchema.methods.toSafeJSON = function () {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    name: this.name,
    role: this.role,
    jobRoles: this.jobRoles,
    avatarInitials: this.avatarInitials,
    phone: this.phone || '',
    active: this.active,
  };
};

module.exports = mongoose.model('StaffMember', staffMemberSchema);
