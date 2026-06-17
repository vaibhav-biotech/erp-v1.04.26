const fs = require('fs');
const path = '/Users/mpiyush/Documents/erp v1.04.26/frontend/src/lib/staffApi.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace("headers: { ...getApiHeaders(), 'Content-Type': 'application/json', ...getApiHeaders() },", "headers: { ...getApiHeaders(), 'Content-Type': 'application/json' },");
fs.writeFileSync(path, content);
