const StaffAttendanceRecord = require('../models/StaffAttendanceRecord');
const StaffTaskRecord = require('../models/StaffTaskRecord');

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function defaultTasks() {
  return [
    {
      id: 't1',
      title: 'Post Instagram reel — Monstera care',
      description: 'Use brand hashtags #PlantsInGarden',
      assigneeId: 'staff-1',
      workType: 'social_media',
      scheduledDate: dateOffset(0),
      scheduledTime: '10:00',
      status: 'in_progress',
      createdById: 'admin-1',
    },
    {
      id: 't2',
      title: 'Reply WhatsApp leads from weekend',
      assigneeId: 'staff-1',
      workType: 'whatsapp',
      scheduledDate: dateOffset(0),
      scheduledTime: '14:00',
      status: 'pending',
      createdById: 'admin-1',
    },
    {
      id: 't3',
      title: 'Update product catalog on WhatsApp Business',
      assigneeId: 'staff-1',
      workType: 'whatsapp',
      scheduledDate: dateOffset(1),
      scheduledTime: '11:00',
      status: 'pending',
      createdById: 'staff-1',
    },
    {
      id: 't4',
      title: 'Story: New indoor plants arrival',
      assigneeId: 'staff-1',
      workType: 'social_media',
      scheduledDate: dateOffset(-1),
      scheduledTime: '16:00',
      status: 'done',
      createdById: 'admin-1',
    },
    {
      id: 't5',
      title: 'Weekly social analytics report',
      assigneeId: 'staff-1',
      workType: 'social_media',
      scheduledDate: dateOffset(2),
      scheduledTime: '',
      status: 'pending',
      createdById: 'admin-1',
    },
  ];
}

function defaultAttendance() {
  return [
    { staffId: 'staff-1', date: dateOffset(-2), status: 'present' },
    { staffId: 'staff-1', date: dateOffset(-1), status: 'present' },
    { staffId: 'staff-1', date: dateOffset(0), status: 'present' },
    { staffId: 'staff-1', date: dateOffset(1), status: 'holiday' },
  ];
}

let seedPromise = null;

async function ensureStaffData() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const taskCount = await StaffTaskRecord.countDocuments();
    if (taskCount === 0) {
      await StaffTaskRecord.insertMany(defaultTasks());
      console.log('[staff-data-seed] Demo tasks created');
    }

    const attCount = await StaffAttendanceRecord.countDocuments();
    if (attCount === 0) {
      await StaffAttendanceRecord.insertMany(defaultAttendance());
      console.log('[staff-data-seed] Demo attendance created');
    }
  })().catch((err) => {
    seedPromise = null;
    console.error('[staff-data-seed] Failed:', err.message);
  });

  return seedPromise;
}

function ensureStaffDataOnce() {
  return ensureStaffData();
}

module.exports = { ensureStaffData, ensureStaffDataOnce, defaultTasks, defaultAttendance };
