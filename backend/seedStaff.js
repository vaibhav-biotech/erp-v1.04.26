/**
 * Seed staff folder demo users (and optional extra accounts).
 * Run from backend/: node seedStaff.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const StaffMember = require('./models/StaffMember');

const DEMO_USERS = [
  {
    id: 'staff-1',
    username: 'priya',
    email: 'staff@plantsingarden.com',
    password: 'staff123',
    name: 'Priya Sharma',
    role: 'staff',
    jobRoles: ['social_media_manager', 'whatsapp_manager'],
    avatarInitials: 'PS',
    phone: '+91 98765 43210',
    active: true,
  },
  {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@plantsingarden.com',
    password: 'admin123',
    name: 'Rahul Manager',
    role: 'staff_admin',
    jobRoles: ['operations'],
    avatarInitials: 'RM',
    phone: '+91 90000 00000',
    active: true,
  },
];

async function upsertStaff(user) {
  const existing = await StaffMember.findOne({ id: user.id }).select('+password');
  if (existing) {
    existing.username = user.username;
    existing.email = user.email;
    existing.name = user.name;
    existing.role = user.role;
    existing.jobRoles = user.jobRoles;
    existing.avatarInitials = user.avatarInitials;
    existing.phone = user.phone;
    existing.active = user.active;
    existing.password = user.password;
    await existing.save();
    console.log(`Updated: ${user.username}`);
    return;
  }

  await StaffMember.create(user);
  console.log(`Created: ${user.username}`);
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  for (const user of DEMO_USERS) {
    await upsertStaff(user);
  }

  const extraUsername = process.argv[2];
  const extraPassword = process.argv[3] || 'staff123';
  if (extraUsername) {
    const username = extraUsername.trim().toLowerCase();
    await upsertStaff({
      id: `staff-${username}`,
      username,
      email: `${username}@plantsingarden.com`,
      password: extraPassword,
      name: username.charAt(0).toUpperCase() + username.slice(1),
      role: 'staff',
      jobRoles: ['operations'],
      avatarInitials: username.slice(0, 2).toUpperCase(),
      phone: '',
      active: true,
    });
  }

  console.log('Done.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
