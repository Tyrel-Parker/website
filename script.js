// Shared utility functions
function formatDate(dateString) {
    // Parse the date as local time to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString();
}

// Load and render apps
async function loadApps() {
    try {
        const response = await fetch('./data/apps.json');
        const apps = await response.json();
        renderApps(apps);
    } catch (error) {
        console.error('Error loading apps:', error);
        document.getElementById('apps-grid').innerHTML = '<div class="loading">Error loading applications</div>';
    }
}

// Generate gradient based on index and type
function getGradient(index, type) {
  // Apps start at 0° (red), hobbies start at 180° (cyan)
  const startHue = type === 'app' ? 0 : 180;
  
  // Each tile shifts by 40 degrees on the color wheel
  const hue = (startHue + (index * 40)) % 360;
  const hue2 = (hue + 20) % 360; // Second color slightly offset
  
  const color1 = `hsl(${hue}, 70%, 65%)`;
  const color2 = `hsl(${hue2}, 70%, 55%)`;
  
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

// Load and render hobbies
async function loadHobbies() {
    try {
        const response = await fetch('./data/hobbies.json');
        const hobbies = await response.json();
        renderHobbies(hobbies);
    } catch (error) {
        console.error('Error loading hobbies:', error);
        document.getElementById('hobbies-grid').innerHTML = '<div class="loading">Error loading hobbies</div>';
    }
}

// Render apps to the page
function renderApps(apps) {
    const container = document.getElementById('apps-grid');
    container.innerHTML = apps.map((app, index) => `
        <a href="${app.url}" class="app-card">
            <div class="app-icon" style="background: ${getGradient(index, 'app')}">${app.icon}</div>
            <h3 class="app-title">${app.name}</h3>
            <p class="app-description">${app.description}</p>
        </a>
    `).join('');
}

// Render hobbies to the page
function renderHobbies(hobbies) {
    const container = document.getElementById('hobbies-grid');
    container.innerHTML = hobbies.map((hobby, index) => {
        const content = `
            <div class="hobby-icon" style="background: ${getGradient(index, 'hobby')}">${hobby.icon}</div>
            <h3 class="hobby-title">${hobby.name}</h3>
            <p class="hobby-description">${hobby.description}</p>
        `;
        
        // If hobby has a link, make it clickable
        if (hobby.link) {
            return `<a href="${hobby.link}" class="hobby-card">${content}</a>`;
        } else {
            return `<div class="hobby-card">${content}</div>`;
        }
    }).join('');
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    loadApps();
    loadHobbies();
});