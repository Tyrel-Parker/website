
async function checkBuildInfo() {
  try {
    const response = await fetch('./build-meta.json');
    const buildInfo = await response.json();
    
    console.group('🚀 Build Information');
    console.log('📅 Built:', new Date(buildInfo.buildTime).toLocaleString());
    console.log('📝 Commit:', buildInfo.gitCommit.substring(0, 8));
    console.log('🌿 Branch:', buildInfo.gitBranch);
    console.log('🔢 Build #:', buildInfo.buildNumber);
    console.groupEnd();
    
    // Store globally for easy access
    window.BUILD_INFO = buildInfo;
    
    return buildInfo;
  } catch (error) {
    console.warn('Could not load build info:', error);
    return null;
  }
}

// Call on page load
checkBuildInfo();