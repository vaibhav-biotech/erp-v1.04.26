const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'frontend', 'src', 'components', 'pages', 'ManageAllStaffPage.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update Staff interface
content = content.replace(
  "interface Staff {\n  _id: string;\n  name: string;\n  username: string;\n  role: string;\n  storeName: string;\n  status: string;\n  createdAt: string;\n}",
  "interface Staff {\n  _id: string;\n  name: string;\n  username: string;\n  role: string;\n  jobRoles: string[];\n  storeName: string;\n  active: boolean;\n  createdAt: string;\n}"
);

// Update Modal parsing
content = content.replace(
  "        role: staff.role,\n        storeName: staff.storeName,\n        status: staff.status",
  "        role: staff.jobRoles && staff.jobRoles[0] ? staff.jobRoles[0] : 'sales',\n        storeName: staff.storeName,\n        status: staff.active ? 'active' : 'inactive'"
);

// Add 'useRouter' import and hook
content = content.replace(
  "import { useAuth } from '@/contexts/AuthContext';",
  "import { useAuth } from '@/contexts/AuthContext';\nimport { useRouter } from 'next/navigation';"
);

content = content.replace(
  "export default function ManageAllStaffPage() {\n  const { adminToken } = useAuth();",
  "export default function ManageAllStaffPage() {\n  const { adminToken } = useAuth();\n  const router = useRouter();"
);

// Update status display in columns
content = content.replace(
  "value === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'",
  "value === true ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
);
content = content.replace(
  "{value ? String(value).toUpperCase() : 'UNKNOWN'}",
  "{value ? 'ACTIVE' : 'SUSPENDED'}"
);
content = content.replace(
  "key: 'status',",
  "key: 'active',"
);

// Update Role display
content = content.replace(
  "key: 'role',",
  "key: 'jobRoles',"
);
content = content.replace(
  "{value ? String(value).replace('_', ' ').toUpperCase() : 'N/A'}",
  "{value && value[0] ? String(value[0]).replace('_', ' ').toUpperCase() : 'N/A'}"
);

// Add View Action
content = content.replace(
  "          onEdit={(row: any) => handleOpenModal(row)}\n          onDelete={(id) => handleDelete(id)}\n          selectable={false}\n        />",
  "          onEdit={(row: any) => handleOpenModal(row)}\n          onDelete={(id) => handleDelete(id)}\n          onView={(row: any) => router.push(`/admin/dashboard/super-admin/manage-staff/\${row._id}`)}\n          selectable={false}\n        />"
);

// Update Status dropdown values to 'active' and 'suspended'
content = content.replace(
  '<option value="inactive">Inactive</option>',
  '<option value="suspended">Suspended</option>'
);

fs.writeFileSync(file, content);
console.log('Patched ManageAllStaffPage.tsx successfully');
