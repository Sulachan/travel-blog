import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyBTkEO-EVLVwpU121PhHSS9St9XPSZC6aQ",
    authDomain: "travel-blog-auth.firebaseapp.com",
    projectId: "travel-blog-auth",
    storageBucket: "travel-blog-auth.firebasestorage.app",
    messagingSenderId: "877186471798",
    appId: "1:877186471798:web:c7a3f9f8ac8a9fb1938c57"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
let currentUser = null;
let appData = null; // In-memory data state
let isLoaded = false;

// Auth Listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (isLoaded) try { render(); } catch (e) { console.error("Render error after auth change", e); }
});

const app = document.getElementById('app');
const mainNav = document.getElementById('main-nav');
const dynamicNavLinks = document.getElementById('dynamic-nav-links');
const menuToggle = document.getElementById('menu-toggle');

// Editor Elements
const editorModal = document.getElementById('editor-modal');
const closeEditor = document.getElementById('close-editor');
const tripForm = document.getElementById('trip-form');
const editorBlocks = document.getElementById('editor-blocks');
const deleteTripBtn = document.getElementById('delete-trip-btn');
const saveBtn = document.getElementById('save-trip-btn');
const filePicker = document.getElementById('file-picker');
const browseCoverBtn = document.getElementById('browse-cover-btn');

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

const DATA_VERSION = 'v3';

// --- Data Management (Firestore + Migration) ---
async function initData() {
    try {
        const docRef = doc(db, "content", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Loaded from Cloud");
            appData = docSnap.data();
        } else {
            console.log("Cloud empty - checking Local Migration");
            const localData = localStorage.getItem('travel_data');
            if (localData) {
                appData = JSON.parse(localData);
            } else {
                appData = { trips: defaultData, recipes: defaultRecipes };
            }

            // Try to seed the cloud silently (will ignore if permissions block it)
            setDoc(docRef, appData).catch(e => console.log("Cloud seeding skipped (guest mode or rules active)"));
        }
    } catch (e) {
        if (e.code === 'permission-denied') {
            console.warn("Firestore Access Restricted (Guest Mode Active)");
        } else {
            console.error("Cloud Connection Error:", e);
        }

        const local = localStorage.getItem('travel_data');
        appData = local ? JSON.parse(local) : { trips: defaultData, recipes: defaultRecipes };
    }
    isLoaded = true;
    render();
}

async function saveData(newData) {
    appData = newData;
    render();
    localStorage.setItem('travel_data', JSON.stringify(newData));

    try {
        await setDoc(doc(db, "content", "main"), newData);
        console.log("Cloud Saved");
    } catch (e) {
        console.error("Save failed:", e);
        alert("Sync Failed: Your changes are saved locally, but not to the cloud. (" + e.code + ")");
    }
}

// --- Router & Renderer ---
function render() {
    if (!isLoaded) {
        app.innerHTML = '<div style="height:100vh; display:flex; justify-content:center; align-items:center;">Loading content...</div>';
        return;
    }

    const hash = window.location.hash;
    const data = appData;

    // Sort trips by date descending (Newest first)
    // Check if data.trips exists to avoid crash on empty db
    const triplist = data.trips || {};
    const sortedTrips = Object.values(triplist).sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return 0;
    });

    // Update Menu (Public - No Edit Buttons)
    renderMenu(sortedTrips);

    if (mainNav) mainNav.classList.remove('active');

    if (hash === '#admin') {
        renderAdmin(data);
    } else if (hash === '#recipes') {
        renderRecipeList(data.recipes || {});
    } else if (hash.startsWith('#trip/')) {
        const id = hash.split('/')[1];
        if (data.trips && data.trips[id]) renderTrip(data.trips[id], 'trip');
        else renderLanding(sortedTrips);
    } else if (hash.startsWith('#recipe/')) {
        const id = hash.split('/')[1];
        if (data.recipes && data.recipes[id]) renderTrip(data.recipes[id], 'recipe');
        else renderRecipeList(data.recipes || {});
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
                <form id="login-form" style="display:flex; flex-direction:column; gap:15px; max-width:300px; margin:20px auto; width:100%;">
                    <input type="email" id="login-email" placeholder="Email" required style="padding:10px; border-radius:4px; border:1px solid #333; background:#000; color:#fff;">
                    <input type="password" id="login-password" placeholder="Password" required style="padding:10px; border-radius:4px; border:1px solid #333; background:#000; color:#fff;">
                    <button type="submit" style="padding:12px; background:var(--accent-color); color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Login</button>
                </form>
            </section>
        `;
        document.getElementById('login-form').onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            signInWithEmailAndPassword(auth, email, password)
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

    // Sort recipes by Country (or Title as fallback)
    const sortedRecipesAdmin = Object.values(data.recipes).sort((a, b) => {
        const countryA = (a.country || a.location || "").toLowerCase();
        const countryB = (b.country || b.location || "").toLowerCase();
        if (countryA < countryB) return -1;
        if (countryA > countryB) return 1;
        return 0;
    });

    // Trips already sorted by date in render() pass, but let's resort here to be sure
    const sortedTripsAdmin = Object.values(data.trips).sort((a, b) => (a.date < b.date ? 1 : -1));

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
                <h2 style="border-bottom:1px solid var(--accent-color); margin-bottom:1rem;">Trips <small style="font-size:0.8rem; font-weight:normal;">(Date)</small></h2>
                <ul style="list-style:none; padding:0;">
                    ${sortedTripsAdmin.map(trip => `
                        <li style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:4px;">
                            <span>${trip.title} <span style="color:#666">(${trip.date})</span></span>
                            <button onclick="window.location.hash='#trip/${trip.id}'; setTimeout(()=>openEditor('${trip.id}', 'trip'), 100)" style="cursor:pointer; color:var(--accent-color); background:none; border:none;">Edit</button>
                        </li>
                    `).join('')}
                </ul>

                <h2 style="border-bottom:1px solid var(--accent-color); margin:2rem 0 1rem;">Recipes <small style="font-size:0.8rem; font-weight:normal;">(Country)</small></h2>
                 <ul style="list-style:none; padding:0;">
                    ${sortedRecipesAdmin.map(recipe => `
                        <li style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:4px;">
                            <span>${recipe.title} <span style="color:#666">(${recipe.country || "General"})</span></span>
                            <button onclick="window.location.hash='#recipe/${recipe.id}'; setTimeout(()=>openEditor('${recipe.id}', 'recipe'), 100)" style="cursor:pointer; color:var(--accent-color); background:none; border:none;">Edit</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </section>
    `;

    document.getElementById('logout-btn').onclick = () => {
        signOut(auth).then(() => {
            window.location.hash = ''; // Redirect to home
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
            <p style="margin-bottom: 2rem;">Flavors I brought back home.</p>
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
            
            ${currentUser
            ? '<li><a href="#admin" class="nav-link" style="color:var(--accent-color);">Manage</a></li>'
            : '<li><a href="#admin" class="nav-link" style="font-size:1.5rem; color:#fff; border:1px solid #333; padding:5px 15px; border-radius:4px; display:inline-block; margin-top:10px;">Login</a></li>'}
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
            <p>Documenting my journey through the world.</p>
            
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

// DOM references for editor already declared at the top

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
    const collection = type === 'recipe' ? (appData.recipes || {}) : (appData.trips || {});

    document.getElementById('editor-title').innerText = id ? `Edit ${type === 'recipe' ? 'Recipe' : 'Trip'}` : `New ${type === 'recipe' ? 'Recipe' : 'Trip'}`;
    saveBtn.innerText = `Save ${type === 'recipe' ? 'Recipe' : 'Trip'}`;

    // Hide/Show fields based on type
    const countryGroup = document.getElementById('form-group-country');
    const locationGroup = document.getElementById('form-group-location');
    const dateGroup = document.getElementById('form-group-date');

    if (type === 'recipe') {
        countryGroup.classList.remove('hidden');
        locationGroup.classList.add('hidden');
        dateGroup.classList.add('hidden');
        document.getElementById('edit-location').required = false;
        document.getElementById('edit-date').required = false;
    } else {
        countryGroup.classList.add('hidden');
        locationGroup.classList.remove('hidden');
        dateGroup.classList.remove('hidden');
        document.getElementById('edit-location').required = true;
        document.getElementById('edit-date').required = true;
    }

    if (id && collection[id]) {
        const item = collection[id];
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-title').value = item.title;
        document.getElementById('edit-date').value = item.date;
        document.getElementById('edit-country').value = item.country || "";
        document.getElementById('edit-location').value = item.location || "";
        document.getElementById('edit-cover').value = item.coverImage;
        deleteTripBtn.classList.remove('hidden');
        deleteTripBtn.innerText = `Delete ${type === 'recipe' ? 'Recipe' : 'Trip'}`;
        renderEditorBlocks(item.blocks);
    } else {
        document.getElementById('edit-id').value = "";
        document.getElementById('edit-title').value = "";
        document.getElementById('edit-date').value = "";
        document.getElementById('edit-country').value = "";
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
        coverImage: document.getElementById('edit-cover').value,
        blocks
    };

    if (currentEditType === 'recipe') newItem.country = document.getElementById('edit-country').value;
    else newItem.location = document.getElementById('edit-location').value;

    if (currentEditType === 'recipe') {
        if (!appData.recipes) appData.recipes = {};
        appData.recipes[id] = newItem;
    } else {
        if (!appData.trips) appData.trips = {};
        appData.trips[id] = newItem;
    }

    saveData(appData);
    editorModal.classList.add('hidden');

    if (currentEditType === 'recipe') window.location.hash = `#recipe/${id}`;
    else window.location.hash = `#trip/${id}`;

    render();
};

deleteTripBtn.onclick = () => {
    const id = document.getElementById('edit-id').value;
    if (confirm(`Are you sure you want to delete this ${currentEditType}?`)) {
        if (currentEditType === 'recipe') delete appData.recipes[id];
        else delete appData.trips[id];

        saveData(appData);
        editorModal.classList.add('hidden');
        window.location.hash = currentEditType === 'recipe' ? '#recipes' : '#home';
        render();
    }
};

// Removed global newTripBtn listener as it is now dynamic inside renderMenu

closeEditor.onclick = () => editorModal.classList.add('hidden');

// Global Listeners
window.addEventListener('hashchange', () => {
    try { render(); } catch (e) { alert("Render Error: " + e.message); console.error(e); }
});

window.addEventListener('DOMContentLoaded', () => {
    console.log("Script v19 loaded - Logout Redirect Fixed");
    initData();
});

// Toggle Menu Button (Unified)
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        if (mainNav) mainNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Close menu when clicking a link inside it
dynamicNavLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.closest('a')) {
        if (mainNav) mainNav.classList.remove('active');
        if (menuToggle) menuToggle.classList.remove('active');
        window.scrollTo(0, 0);
    }
});
