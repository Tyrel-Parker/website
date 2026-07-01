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

const CATEGORY_ORDER = ['Tools', 'Learning', 'Games'];
const COLLAPSE_KEY = 'appCategoryState';

function getCategoryState() {
    try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY)) || {}; }
    catch { return {}; }
}

function saveCategoryState(state) {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(state));
}

// Render apps to the page grouped by category
function renderApps(apps) {
    const container = document.getElementById('apps-grid');
    const state = getCategoryState();

    const grouped = {};
    apps.forEach((app, index) => {
        const cat = app.category || 'Other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ ...app, _index: index });
    });

    const categories = Object.keys(grouped).sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a);
        const bi = CATEGORY_ORDER.indexOf(b);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });

    container.innerHTML = categories.map(cat => {
        const collapsed = state[cat] !== false; // default: collapsed
        const items = grouped[cat];
        const cards = items.map(app => `
            <a href="${app.url}" class="app-card">
                <div class="app-icon" style="background: ${getGradient(app._index, 'app')}">${app.icon}</div>
                <h3 class="app-title">${app.name}</h3>
                <p class="app-description">${app.description}</p>
            </a>
        `).join('');

        return `
            <div class="app-category">
                <button class="category-header${collapsed ? '' : ' open'}" data-category="${cat}">
                    <span class="category-title">${cat}</span>
                    <span class="category-count">${items.length} app${items.length !== 1 ? 's' : ''}</span>
                    <span class="category-toggle">▼</span>
                </button>
                <div class="category-content${collapsed ? ' collapsed' : ''}">
                    <div class="apps-grid">${cards}</div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.category-header').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.category;
            const content = btn.nextElementSibling;
            const nowCollapsed = !content.classList.contains('collapsed');
            content.classList.toggle('collapsed', nowCollapsed);
            btn.classList.toggle('open', !nowCollapsed);
            const s = getCategoryState();
            s[cat] = nowCollapsed;
            saveCategoryState(s);
        });
    });
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