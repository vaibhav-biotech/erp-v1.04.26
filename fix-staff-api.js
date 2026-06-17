const fs = require('fs');
const path = '/Users/mpiyush/Documents/erp v1.04.26/frontend/src/lib/staffApi.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import \{ buildApiUrl \} from '@\/lib\/storeConfig';/, "import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';");

content = content.replace(
  /const res = await fetch\(buildApiUrl\('\/api\/staff\/login'\), \{[\s\n]*method: 'POST',[\s\n]*headers: \{ 'Content-Type': 'application\/json' \},/m,
  "const res = await fetch(buildApiUrl('/api/staff/login'), {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json', ...getApiHeaders() },"
);

// We should also replace the headers in ALL other fetches!
content = content.replace(/headers: \{/g, "headers: { ...getApiHeaders(),");
// Wait, some of them have: headers: { Authorization: ... }
// `getApiHeaders(token)` can do it natively! But wait, `getApiHeaders()` without token will just add `x-store-name`. Then they add Authorization later.

fs.writeFileSync(path, content);
console.log('Fixed staffApi.ts');
