const mongoose = require('mongoose');
const StaffMember = require('../models/StaffMember');

/** Default staff-folder accounts — upserted on server start so production login works. */
const DEMO_STAFF_USERS = [
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

async function upsertDemoUser(user) {
  const existing = await StaffMember.findOne({
    $or: [{ id: user.id }, { username: user.username }, { email: user.email }],
  }).select('+password');
  if (existing) {
    existing.id = user.id;
    existing.username = user.username;
    existing.email = user.email;
    existing.name = user.name;
    existing.role = user.role;
    existing.jobRoles = user.jobRoles;
    existing.avatarInitials = user.avatarInitials;
    existing.phone = user.phone;
    existing.active = user.active;
    existing.password = user.password;
    if (!existing.storeName) existing.storeName = 'plantsingarden';
    await existing.save();
    return 'updated';
  }

  await StaffMember.create({ ...user, storeName: 'plantsingarden' });
  return 'created';
}

let seedInFlight = null;

/**
 * Ensures demo staff/admin accounts exist (and passwords match demo values).
 * Safe to call on every server start and before login when DB was empty.
 */
async function ensureStaffDemoUsers() {
  if (mongoose.connection.readyState !== 1) {
    return { ok: false, reason: 'database_not_connected' };
  }

  const results = [];
  for (const user of DEMO_STAFF_USERS) {
    results.push(await upsertDemoUser(user));
  }

  const count = await StaffMember.countDocuments();
  console.log(`[staff-seed] Demo accounts ready (${count} total staff in DB)`);
  return { ok: true, results, count };
}

function ensureStaffDemoUsersOnce() {
  if (!seedInFlight) {
    seedInFlight = ensureStaffDemoUsers()
      .catch((err) => {
        console.error('[staff-seed] Failed:', err.message);
        return { ok: false, error: err.message };
      })
      .finally(() => {
        seedInFlight = null;
      });
  }
  return seedInFlight;
}

module.exports = {
  DEMO_STAFF_USERS,
  ensureStaffDemoUsers,
  ensureStaffDemoUsersOnce,
};
