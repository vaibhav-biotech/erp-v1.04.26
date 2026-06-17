const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'frontend', 'src', 'components', 'Sidebar.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `            { role === 'super_admin' && (
              <>
                <button
                  onClick={() => handleNavigation('/admin/dashboard/super-admin', 'manage-stores')}
                  className=\`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors \${
                    isActive('/admin/dashboard/super-admin', 'manage-stores')
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }\`
                >
                  <FiGrid className="w-5 h-5" />
                  <span className="font-medium">Manage Stores</span>
                </button>
                <button
                  onClick={() => handleNavigation('/admin/dashboard/super-admin', 'manage-staff')}
                  className=\`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors \${
                    isActive('/admin/dashboard/super-admin', 'manage-staff')
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }\`
                >
                  <FiUsers className="w-5 h-5" />
                  <span className="font-medium">Manage Staff</span>
                </button>
              </>
            )}`;

const newStr = `            { role === 'super_admin' && (
              <>
                <button
                  onClick={() => handleNavigation('/admin/dashboard/super-admin', 'manage-stores')}
                  className=\`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors \${
                    isActive('/admin/dashboard/super-admin', 'manage-stores')
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }\`
                >
                  <FiGrid className="w-5 h-5" />
                  <span className="font-medium">Manage Stores</span>
                </button>
                <button
                  onClick={() => handleNavigation('/admin/dashboard/super-admin', 'manage-staff')}
                  className=\`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors \${
                    isActive('/admin/dashboard/super-admin', 'manage-staff')
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }\`
                >
                  <FiUsers className="w-5 h-5" />
                  <span className="font-medium">Manage Staff</span>
                </button>
                <button
                  onClick={() => handleNavigation('/admin/dashboard/super-admin', 'all-orders')}
                  className=\`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors \${
                    isActive('/admin/dashboard/super-admin', 'all-orders')
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }\`
                >
                  <FiShoppingCart className="w-5 h-5" />
                  <span className="font-medium">All Orders</span>
                </button>
              </>
            )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newStr);
  fs.writeFileSync(file, content);
  console.log('Successfully patched Sidebar.tsx');
} else {
  console.log('Target string not found in Sidebar.tsx');
}
