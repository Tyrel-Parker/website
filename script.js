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
    container.innerHTML = apps.map(app => `
        <a href="${app.url}" class="app-card">
            <div class="app-icon ${app.colorClass}">${app.icon}</div>
            <h3 class="app-title">${app.name}</h3>
            <p class="app-description">${app.description}</p>
        </a>
    `).join('');
}

// Render hobbies to the page
function renderHobbies(hobbies) {
    const container = document.getElementById('hobbies-grid');
    container.innerHTML = hobbies.map(hobby => {
        const content = `
            <div class="hobby-icon ${hobby.colorClass}">${hobby.icon}</div>
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