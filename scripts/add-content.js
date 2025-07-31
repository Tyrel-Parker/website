const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function addContent(config) {
  const {
    contentDir,
    indexFileName,
    contentType,
    emoji,
    gitPaths,
    titleField = 'title'
  } = config;

  const indexFile = path.join(contentDir, indexFileName);

  // Ensure content directory exists
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  // Get current index
  const currentIndex = fs.existsSync(indexFile) 
    ? JSON.parse(fs.readFileSync(indexFile, 'utf8'))
    : [];

  // Get all JSON files (excluding the index file)
  const allFiles = fs.readdirSync(contentDir)
    .filter(file => file.endsWith('.json') && file !== indexFileName)
    .sort();

  // Find new files
  const newFiles = allFiles.filter(file => !currentIndex.includes(file));

  if (newFiles.length === 0) {
    console.log(`${emoji} No new ${contentType} found.`);
    process.exit(0);
  }

  // Update index
  fs.writeFileSync(indexFile, JSON.stringify(allFiles, null, 2));

  // Get titles for commit message
  const newTitles = newFiles.map(file => {
    try {
      const contentData = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf8'));
      return contentData[titleField];
    } catch (error) {
      return file.replace('.json', '');
    }
  });

  // Git operations
  try {
    execSync(`git add ${gitPaths.join(' ')}`, { stdio: 'inherit' });
    
    const commitMessage = newFiles.length === 1 
      ? `Add ${contentType}: ${newTitles[0]}`
      : `Add ${contentType}: ${newTitles.join(', ')}`;
      
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    console.log(`✅ Successfully committed: ${commitMessage}`);
    console.log(`${emoji} New ${contentType} added:`, newTitles.join(', '));
    console.log('🚀 Run "git push" to deploy to GitHub Pages');
    
  } catch (error) {
    console.error('❌ Git operation failed:', error.message);
  }
}

// Export the function
module.exports = addContent;