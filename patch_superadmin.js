const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'backend', 'routes', 'superadmin.js');
let content = fs.readFileSync(file, 'utf8');

const newRoutes = `
// Create a new staff member
router.post('/staff', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const { name, username, password, role, storeName } = req.body;
    
    if (!name || !username || !password || !role || !storeName) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existingStaff = await StaffMember.findOne({ username });
    if (existingStaff) {
      return res.status(400).json({ success: false, error: 'A staff member with this username already exists' });
    }

    const newStaff = new StaffMember({
      name,
      username,
      password,
      role,
      storeName: storeName.toLowerCase().trim().replace(/\\s+/g, ''),
      status: 'active'
    });

    await newStaff.save();
    
    const staffObj = newStaff.toObject();
    delete staffObj.password;
    
    return res.status(201).json({ success: true, data: staffObj });
  } catch (error) {
    console.error('[Superadmin Create Staff Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Update a staff member
router.put('/staff/:id', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const { name, username, role, storeName, status, password } = req.body;
    
    const staff = await StaffMember.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }

    if (name) staff.name = name;
    if (username) staff.username = username;
    if (role) staff.role = role;
    if (storeName) staff.storeName = storeName.toLowerCase().trim().replace(/\\s+/g, '');
    if (status) staff.status = status;
    if (password) staff.password = password;

    await staff.save();
    
    const staffObj = staff.toObject();
    delete staffObj.password;
    
    return res.status(200).json({ success: true, data: staffObj });
  } catch (error) {
    console.error('[Superadmin Update Staff Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a staff member
router.delete('/staff/:id', async (req, res) => {
  try {
    const StaffMember = require('../models/StaffMember');
    const staff = await StaffMember.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    
    return res.status(200).json({ success: true, data: { _id: req.params.id } });
  } catch (error) {
    console.error('[Superadmin Delete Staff Error]', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
`;

content = content.replace('module.exports = router;', newRoutes);
fs.writeFileSync(file, content);
console.log('Successfully patched backend/routes/superadmin.js');
