const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let originalContent = content;
      
      // Remove Welcome headers like <div className="..."><h1...>Welcome...</h1><p>...</p></div>
      content = content.replace(/<div[^>]*bg-gradient[^>]*>[\s\S]*?<h1[^>]*>Welcome[^<]*<\/h1>[\s\S]*?<\/div>/g, '');
      
      // Remove standard h1/h2 headings at the top of pages
      content = content.replace(/<h[12][^>]*text-[23]xl font-bold[^>]*>.*?<\/h[12]>/g, '');
      
      // Sometimes there are subheadings <p className="text-gray-600 mb-6">Manage...</p>
      content = content.replace(/<p[^>]*text-gray-500[^>]*>Manage your.*?<\/p>/g, '');
      content = content.replace(/<p[^>]*text-gray-600[^>]*>Manage your.*?<\/p>/g, '');

      if (content !== originalContent) {
        console.log(`Updated ${fullPath}`);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(__dirname, 'src', 'components'));
processDir(path.join(__dirname, 'src', 'app', 'admin', 'dashboard'));

console.log("Done stripping headers");
