const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const file = path.join(__dirname, 'backend', 'routes', 'superadmin.js');
let content = fs.readFileSync(file, 'utf8');

// The file currently has a router.post('/staff') and router.put('/staff/:id').
// We will use replace with regex to update them.

// 1. Add StaffAttendanceRecord and StaffTaskRecord imports at the top
content = content.replace(
  "const Store = require('../models/Store');",
  "const Store = require('../models/Store');\nconst StaffAttendanceRecord = require('../models/StaffAttendanceRecord');\nconst StaffTaskRecord = require('../models/StaffTaskRecord');\nconst crypto = require('crypto');"
);

// 2. Replace the POST and PUT logic for staff
const oldPost = `    const newStaff = new StaffMember({
      name,
      username,
      password,
      role,
      storeName: storeName.toLowerCase().trim().replace(/\\s+/g, ''),
      status: 'active'
    });`;

const newPost = `    const newStaff = new StaffMember({
      id: crypto.randomUUID(),
      name,
      username,
      email: \`\${username}@\${storeName.toLowerCase().trim().replace(/\\s+/g, '')}.com\`, // Mock email since frontend doesn't send it
      password,
      role: 'staff', // Schema restricts to staff or staff_admin
      jobRoles: [role], // Use jobRoles for frontend's role
      storeName: storeName.toLowerCase().trim().replace(/\\s+/g, ''),
      active: true
    });`;

content = content.replace(oldPost, newPost);

const oldPut = `    if (name) staff.name = name;
    if (username) staff.username = username;
    if (role) staff.role = role;
    if (storeName) staff.storeName = storeName.toLowerCase().trim().replace(/\\s+/g, '');
    if (status) staff.status = status;
    if (password) staff.password = password;`;

const newPut = `    if (name) staff.name = name;
    if (username) staff.username = username;
    if (role) staff.jobRoles = [role];
    if (storeName) staff.storeName = storeName.toLowerCase().trim().replace(/\\s+/g, '');
    if (status) staff.active = (status === 'active');
    if (password) staff.password = password;`;

content = content.replace(oldPut, newPut);

// 3. Add attendance and task endpoints
const newEndpoints = `
// Get staff attendance
router.get('/staff/:id/attendance', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found' });

    const attendance = await StaffAttendanceRecord.find({ staffId: staff.id }).sort({ date: -1 }).limit(30);
    return res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get staff tasks
router.get('/staff/:id/tasks', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found' });

    const tasks = await StaffTaskRecord.find({ assigneeId: staff.id }).sort({ createdAt: -1 }).limit(50);
    const mappedTasks = tasks.map(t => t.toClientJSON());
    return res.status(200).json({ success: true, data: mappedTasks });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
`;

content = content.replace('module.exports = router;', newEndpoints);

fs.writeFileSync(file, content);
console.log('Patched superadmin.js successfully');
