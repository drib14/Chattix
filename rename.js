const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        filelist = walkSync(dir + '/' + file, filelist);
      }
    }
    else {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const allFiles = walkSync(__dirname);

let replacedCount = 0;

for (const file of allFiles) {
  if (file.includes('node_modules') || file.includes('.git') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.svg') || file.endsWith('.env') || file.endsWith('.env.example') || file.includes('package-lock.json') || file.endsWith('rename.js')) {
    continue;
  }

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // process.env replacements
  content = content.replace(/process\.env\.MONGODB_URI/g, 'process.env.MONGO_URI');
  content = content.replace(/process\.env\.JWT_SECRET/g, 'process.env.ACCESS_TOKEN_SECRET');
  content = content.replace(/process\.env\.EMAIL_PASS/g, 'process.env.EMAIL_PASSWORD');
  content = content.replace(/process\.env\["MONGODB_URI"\]/g, 'process.env["MONGO_URI"]');
  content = content.replace(/process\.env\["JWT_SECRET"\]/g, 'process.env["ACCESS_TOKEN_SECRET"]');
  content = content.replace(/process\.env\["EMAIL_PASS"\]/g, 'process.env["EMAIL_PASSWORD"]');

  // Platform renaming
  // Case sensitive replace
  content = content.replace(/Nexus/g, 'Chattix');
  content = content.replace(/NEXUS/g, 'CHATTIX');

  // Replace nexus to chattix but we need to be careful.
  // Let's replace 'nexus-' to 'chattix-' (like classes and names)
  content = content.replace(/nexus-/g, 'chattix-');
  content = content.replace(/nexus\//g, 'chattix/'); // for cloudinary folders
  content = content.replace(/nexus:/g, 'chattix:'); // for tailwind

  // also specifically replace 'nexus' in tailwind config and package json if any
  content = content.replace(/nexus/g, 'chattix');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Total files updated: ${replacedCount}`);
