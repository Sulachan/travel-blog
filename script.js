
const app = document.getElementById('app');
const mainNav = document.getElementById('main-nav');
const dynamicNavLinks = document.getElementById('dynamic-nav-links');
const menuToggle = document.getElementById('menu-toggle');
const closeNav = document.getElementById('close-nav');
const newTripBtn = document.getElementById('new-trip-btn');

// Editor Elements
const editorModal = document.getElementById('editor-modal');
const closeEditor = document.getElementById('close-editor');
const tripForm = document.getElementById('trip-form');
const editorBlocks = document.getElementById('editor-blocks');
const deleteTripBtn = document.getElementById('delete-trip-btn');

const TIMESTAMP = Date.now();

// Default Data (for first load)
const defaultData = {
    "indonesia-2024": {
        id: "indonesia-2024",
        title: "Indonesia",
        date: "2024",
        location: "Bali & Komodo",
        coverImage: "assets/images/indonesia.png",
        blocks: [
            { type: 'text', content: "Our trip to Indonesia was an awakening of the senses. From the spiritual aura of Bali's temples to the rugged, prehistoric landscapes of Komodo National Park, every moment felt like a scene from an adventure novel." },
            { type: 'text', content: "We started in Ubud, surrounded by lush rice terraces and vibrant culture. The local artisans and the calmness of the water temples set the tone for the trip." },
            { type: 'image', content: "assets/images/indonesia.png" },
            { type: 'text', content: "Then, we ventured east to the Komodo islands. Diving with manta rays and walking among the legendary Komodo dragons was a humbling reminder of nature's raw power." }
        ]
    },
    "sea-2025": {
        id: "sea-2025",
        title: "South East Asia",
        date: "2025",
        location: "Thailand, Vietnam, Cambodia",
        coverImage: "assets/images/sea.png",
        blocks: [
            { type: 'text', content: "2025 marked our grand tour of South East Asia. It was a cacophony of street food, motorbike engines, and ancient history." },
            { type: 'text', content: "Bangkok's energy was infectious. We got lost in the markets, ate the best Pad Thai of our lives, and marveling at the Grand Palace." },
            { type: 'image', content: "assets/images/sea.png" },
            { type: 'text', content: "Vietnam offered a change of pace with the limestone karsts of Ha Long Bay and the lantern-lit streets of Hoi An." }
        ]
    }
};

const defaultRecipes = {
    "nasi-goreng": {
        id: "nasi-goreng",
        title: "Bali Nasi Goreng",
        date: "From Indonesia 2024",
        location: "Ubud, Bali",
        coverImage: "assets/images/indonesia.png",
        blocks: [
            { type: 'text', content: "The secret to a great Nasi Goreng is the Kecap Manis (sweet soy sauce) and day-old rice." },
            { type: 'text', content: "Ingredients: Rice, Shallots, Garlic, Chili, Kecap Manis, Egg, Shrimp Paste." }
        ]
    }
};

const DATA_VERSION = 'v3'; // Increment to force reset

const storage = {
    getData: () => {
        const stored = localStorage.getItem('travel_data');
        const version = localStorage.getItem('travel_version');

        if (!stored || version !== DATA_VERSION) {
            console.log('Resetting data to version:', DATA_VERSION);
            const data = { trips: defaultData, recipes: defaultRecipes };
            localStorage.setItem('travel_data', JSON.stringify(data));
            localStorage.setItem('travel_version', DATA_VERSION);
            return data;
        }
        return JSON.parse(stored);
    },
    saveData: (data) => {
        localStorage.setItem('travel_data', JSON.stringify(data));
        return data;
    }
};

// --- Router & Renderer ---
function render() {
    const hash = window.location.hash;
    const data = storage.getData();

    // Sort trips by date descending (Newest first)
    const sortedTrips = Object.values(data.trips).sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return 0;
    });

    // Update Menu (Public - No Edit Buttons)
    renderMenu(sortedTrips);

    mainNav.classList.remove('active');

    if (hash === '#admin') {
        renderAdmin(data);
    } else if (hash === '#recipes') {
        renderRecipeList(data.recipes);
    } else if (hash.startsWith('#trip/')) {
        const id = hash.split('/')[1];
        if (data.trips[id]) renderTrip(data.trips[id], 'trip');
        else renderLanding(sortedTrips);
    } else if (hash.startsWith('#recipe/')) {
        const id = hash.split('/')[1];
        if (data.recipes[id]) renderTrip(data.recipes[id], 'recipe');
        else renderRecipeList(data.recipes);
    } else {
        renderLanding(sortedTrips);
    }
}

function renderAdmin(data) {
    if (!currentUser) {
        app.innerHTML = `
            <section class="hero" style="background:var(--bg-color);">
                <h1>Admin Access</h1>
                <p>Please log in to manage your content.</p>
                <button id="admin-login-btn" style="padding:15px 30px; background:#fff; color:#333; border:none; border-radius:4px; font-weight:bold; cursor:pointer; margin-top:20px; display:inline-flex; align-items:center; gap:10px;">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20">
                    Sign in with Google
                </button>
            </section>
        `;
        document.getElementById('admin-login-btn').onclick = () => {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider)
                .then(() => {
                    // onAuthStateChanged will trigger render
                })
                .catch((error) => {
                    console.error("Login failed", error);
                    alert("Login failed: " + error.message);
                });
        };
        return;
    }

    app.innerHTML = `
        <section class="hero" style="height:auto; min-height:100vh; padding-top:100px; justify-content:flex-start;">
            <div style="display:flex; justify-content:space-between; width:100%; max-width:800px; align-items:center;">
                <h1 style="font-size:2rem;">Dashboard</h1>
                <div style="text-align:right;">
                    <small style="display:block; color:#888; margin-bottom:5px;">${currentUser.email}</small>
                    <button id="logout-btn" style="background:none; border:1px solid #666; color:#aaa; padding:5px 10px; cursor:pointer; border-radius:4px;">Logout</button>
                </div>
            </div>
            
            <div style="display:flex; gap:20px; margin-bottom:2rem; margin-top:2rem;">
                 <button onclick="openEditor(null, 'trip')" class="save-btn" style="width:auto; padding:10px 20px;">+ New Trip</button>
                 <button onclick="openEditor(null, 'recipe')" class="save-btn" style="width:auto; padding:10px 20px;">+ New Recipe</button>
            </div>
            
            <div style="width:100%; max-width:800px; text-align:left;">
                <h2 style="border-bottom:1px solid var(--accent-color); margin-bottom:1rem;">Trips</h2>
                <ul style="list-style:none; padding:0;">
                    ${Object.values(data.trips).map(trip => `
                        <li style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:4px;">
                            <span>${trip.title}</span>
                            <button onclick="window.location.hash='#trip/${trip.id}'; setTimeout(()=>openEditor('${trip.id}', 'trip'), 100)" style="cursor:pointer; color:var(--accent-color); background:none; border:none;">Edit</button>
                        </li>
                    `).join('')}
                </ul>

                <h2 style="border-bottom:1px solid var(--accent-color); margin:2rem 0 1rem;">Recipes</h2>
                 <ul style="list-style:none; padding:0;">
                    ${Object.values(data.recipes).map(recipe => `
                        <li style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:4px;">
                            <span>${recipe.title}</span>
                            <button onclick="window.location.hash='#recipe/${recipe.id}'; setTimeout(()=>openEditor('${recipe.id}', 'recipe'), 100)" style="cursor:pointer; color:var(--accent-color); background:none; border:none;">Edit</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </section>
    `;

    document.getElementById('logout-btn').onclick = () => {
        signOut(auth).then(() => {
            // onAuthStateChanged will trigger render
        });
    };
}

function renderRecipeList(recipes) {
    // Sort recipes by date descending too for consistency
    const sortedRecipes = Object.values(recipes).sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return 0;
    });

    app.innerHTML = `
        <a href="#home" class="back-home-btn" aria-label="Back to Home">←</a>
        <section class="hero" style="height:auto; min-height:100vh; padding-top:100px; padding-bottom:100px; justify-content:flex-start; overflow:visible;">
            <h1>Culinary Journey</h1>
            <p style="margin-bottom: 2rem;">Flavors we brought back home.</p>
            <div class="hero-menu" style="opacity:1; animation:none;">
                ${sortedRecipes.map(recipe => `
                    <div class="trip-card" onclick="window.location.hash='#recipe/${recipe.id}'">
                        <img src="${recipe.coverImage}" alt="${recipe.title}" loading="lazy">
                        <div class="content">
                            <span>${recipe.location}</span>
                            <h3>${recipe.title}</h3>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
    document.title = "Recipes | Travel Log";
}

function renderMenu(sortedTripArray) {
    dynamicNavLinks.innerHTML = `
        <ul style="list-style:none; text-align:center; padding:0;">
            <li><a href="#home" class="nav-link" data-route="home">Home</a></li>
            
            <!-- Trips Toggle -->
            <li>
                <button id="trips-toggle" class="nav-link" style="background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:10px;">
                    Trips <span id="trips-arrow" style="font-size:1.5rem; transition:transform 0.3s;">▼</span>
                </button>
                <div id="trips-submenu" style="max-height:0; overflow:hidden; transition:max-height 0.3s ease-out; background:rgba(255,255,255,0.05); margin-top:10px; border-radius:8px;">
                    <ul style="list-style:none; padding:1rem 0;">
                        ${sortedTripArray.map(trip => `
                            <li style="margin:10px 0; opacity:1; transform:none;"><a href="#trip/${trip.id}" class="nav-link" style="font-size:1.5rem;">${trip.title} ${trip.date}</a></li>
                        `).join('')}
                    </ul>
                </div>
            </li>

            <li><a href="#recipes" class="nav-link">Recipes</a></li>
        </ul>
    `;

    // Toggle Logic
    const toggleBtn = document.getElementById('trips-toggle');
    const submenu = document.getElementById('trips-submenu');
    const arrow = document.getElementById('trips-arrow');

    toggleBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent closing nav
        if (submenu.style.maxHeight === '0px' || !submenu.style.maxHeight) {
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            arrow.style.transform = 'rotate(180deg)';
        } else {
            submenu.style.maxHeight = '0px';
            arrow.style.transform = 'rotate(0deg)';
        }
    };
}

function renderLanding(sortedTripArray) {
    app.innerHTML = `
        <section class="hero">
            <h1>Wanderlust Chronicles</h1>
            <p>Documenting our journey through the world's most beautiful landscapes.</p>
            
            <div class="hero-menu">
                ${sortedTripArray.map(trip => `
                    <div class="trip-card" onclick="window.location.hash='#trip/${trip.id}'">
                        <img src="${trip.coverImage}" alt="${trip.title}" loading="lazy">
                        <div class="content">
                            <span>${trip.date}</span>
                            <h3>${trip.title}</h3>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
    document.title = "Wanderlust Chronicles";
}

function renderTrip(item, type = 'trip') {
    const backLink = type === 'recipe' ? '#recipes' : '#home';
    app.innerHTML = `
        <article class="trip-detail">
            <a href="${backLink}" class="back-home-btn" aria-label="Back">←</a>
            <header>
                <div class="trip-background">
                    <img src="${item.coverImage}" alt="${item.title}">
                </div>
                <div class="header-content">
                    <div class="date-location">${item.date} : ${item.location}</div>
                    <h1>${item.title}</h1>
                </div>
            </header>
            
            <section class="trip-content">
                <div class="trip-blocks">
                    ${item.blocks.map(block => {
        if (block.type === 'text') return `<p>${block.content}</p>`;
        if (block.type === 'image') return `<div class="trip-image-block"><img src="${block.content}" alt="Trip Image"></div>`;
        return '';
    }).join('')}
                </div>
            </section>
        </article>
    `;
    window.scrollTo(0, 0);
    document.title = `${item.title} | Travel Log`;
}

// --- Editor Logic ---
let currentEditType = 'trip';
let currentInputTarget = null; // To track which input should receive the image path

const filePicker = document.getElementById('file-picker');
const browseCoverBtn = document.getElementById('browse-cover-btn');
const saveBtn = document.querySelector('.save-btn');

// File Upload Handler
filePicker.onchange = (e) => {
    const file = e.target.files[0];
    if (file && currentInputTarget) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            currentInputTarget.value = evt.target.result; // Base64 Data URL
        };
        reader.readAsDataURL(file);
    }
    filePicker.value = ''; // Reset
};

function triggerBrowse(inputElement) {
    currentInputTarget = inputElement;
    filePicker.click();
}

window.openEditor = function (id, type = 'trip') {
    currentEditType = type;
    editorModal.classList.remove('hidden');
    const data = storage.getData();
    const collection = type === 'recipe' ? data.recipes : data.trips;

    document.getElementById('editor-title').innerText = id ? `Edit ${type === 'recipe' ? 'Recipe' : 'Trip'}` : `New ${type === 'recipe' ? 'Recipe' : 'Trip'}`;
    saveBtn.innerText = `Save ${type === 'recipe' ? 'Recipe' : 'Trip'}`;

    if (id && collection[id]) {
        // Edit Mode
        const item = collection[id];
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-title').value = item.title;
        document.getElementById('edit-date').value = item.date;
        document.getElementById('edit-location').value = item.location;
        document.getElementById('edit-cover').value = item.coverImage;
        deleteTripBtn.classList.remove('hidden');
        deleteTripBtn.innerText = `Delete ${type === 'recipe' ? 'Recipe' : 'Trip'}`;
        renderEditorBlocks(item.blocks);
    } else {
        // Create Mode
        document.getElementById('edit-id').value = "";
        document.getElementById('edit-title').value = "";
        document.getElementById('edit-date').value = "";
        document.getElementById('edit-location').value = "";
        document.getElementById('edit-cover').value = "";
        deleteTripBtn.classList.add('hidden');
        renderEditorBlocks([]);
    }
};

browseCoverBtn.onclick = () => triggerBrowse(document.getElementById('edit-cover'));

function renderEditorBlocks(blocks) {
    editorBlocks.innerHTML = '';
    blocks.forEach((block) => {
        createBlockElement(block.type, block.content);
    });
}

function createBlockElement(type, content = '') {
    const div = document.createElement('div');
    div.className = 'editor-block-item';

    let inputHtml = '';
    if (type === 'text') {
        inputHtml = `<textarea class="block-content" rows="3">${content}</textarea>`;
    } else {
        inputHtml = `
            <div style="flex:1; display:flex; gap:10px;">
                <input type="text" class="block-content" value="${content}" placeholder="Image URL">
                <button type="button" class="browse-btn" style="padding:0.2rem 0.5rem;">Browse</button>
            </div>`;
    }

    div.innerHTML = `
        <span class="block-type">${type.toUpperCase()}</span>
        ${inputHtml}
        <button type="button" class="remove-block">&times;</button>
    `;

    if (type === 'image') {
        const input = div.querySelector('input.block-content');
        div.querySelector('.browse-btn').onclick = () => triggerBrowse(input);
    }

    div.querySelector('.remove-block').onclick = () => div.remove();
    editorBlocks.appendChild(div);
}

function addBlock(type) {
    createBlockElement(type);
}

// Event Listeners
document.getElementById('add-text-block').onclick = () => addBlock('text');
document.getElementById('add-image-block').onclick = () => addBlock('image');

tripForm.onsubmit = (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value ||
        document.getElementById('edit-title').value.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const blocks = [];
    document.querySelectorAll('.editor-block-item').forEach(item => {
        const type = item.querySelector('.block-type').innerText.toLowerCase();
        const content = item.querySelector('.block-content').value;
        blocks.push({ type, content });
    });

    const newItem = {
        id,
        title: document.getElementById('edit-title').value,
        date: document.getElementById('edit-date').value,
        location: document.getElementById('edit-location').value,
        coverImage: document.getElementById('edit-cover').value,
        blocks
    };

    const data = storage.getData();
    if (currentEditType === 'recipe') {
        data.recipes[id] = newItem;
    } else {
        data.trips[id] = newItem;
    }

    storage.saveData(data);
    editorModal.classList.add('hidden');

    // Redirect based on type
    if (currentEditType === 'recipe') window.location.hash = `#recipe/${id}`;
    else window.location.hash = `#trip/${id}`;

    render();
};

deleteTripBtn.onclick = () => {
    const id = document.getElementById('edit-id').value;
    if (confirm(`Are you sure you want to delete this ${currentEditType}?`)) {
        const data = storage.getData();
        if (currentEditType === 'recipe') delete data.recipes[id];
        else delete data.trips[id];

        storage.saveData(data);
        editorModal.classList.add('hidden');
        window.location.hash = currentEditType === 'recipe' ? '#recipes' : '#home';
        render();
    }
};

// Removed global newTripBtn listener as it is now dynamic inside renderMenu

closeEditor.onclick = () => editorModal.classList.add('hidden');

// Global Listeners
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
menuToggle.addEventListener('click', () => mainNav.classList.add('active'));
closeNav.addEventListener('click', () => mainNav.classList.remove('active'));
