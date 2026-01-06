
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

    // Update Menu
    renderMenu(data.trips);

    mainNav.classList.remove('active');

    if (hash === '#recipes') {
        renderRecipeList(data.recipes);
    } else if (hash.startsWith('#trip/')) {
        const id = hash.split('/')[1];
        if (data.trips[id]) renderTrip(data.trips[id], 'trip');
        else renderLanding(data.trips);
    } else if (hash.startsWith('#recipe/')) {
        const id = hash.split('/')[1];
        if (data.recipes[id]) renderTrip(data.recipes[id], 'recipe');
        else renderRecipeList(data.recipes);
    } else {
        renderLanding(data.trips);
    }
}

function renderRecipeList(recipes) {
    app.innerHTML = `
        <section class="hero" style="height:50vh; min-height:400px;">
            <h1>Culinary Journey</h1>
            <p>Flavors we brought back home.</p>
            <div class="hero-menu">
                ${Object.values(recipes).map(recipe => `
                    <div class="trip-card" onclick="window.location.hash='#recipe/${recipe.id}'">
                        <img src="${recipe.coverImage}" alt="${recipe.title}" loading="lazy">
                        <div class="content">
                            <span>${recipe.location}</span>
                            <h3>${recipe.title}</h3>
                        </div>
                    </div>
                `).join('')}
            </div>
             <button onclick="openEditor(null, 'recipe')" style="margin-top:2rem; padding:10px 20px; background:var(--accent-color); border:none; border-radius:4px; font-weight:bold; cursor:pointer;">+ Add Recipe</button>
        </section>
    `;
    document.title = "Recipes | Travel Log";
}

function renderMenu(trips) {
    dynamicNavLinks.innerHTML = `
        <ul style="list-style:none; text-align:center;">
             ${Object.values(trips).map(trip => `
                <li><a href="#trip/${trip.id}" class="nav-link">${trip.title} ${trip.date}</a></li>
             `).join('')}
        </ul>
    `;
}

function renderLanding(trips) {
    app.innerHTML = `
        <section class="hero">
            <h1>Wanderlust Chronicles</h1>
            <p>Documenting our journey through the world's most beautiful landscapes.</p>
            
            <div class="hero-menu">
                ${Object.values(trips).map(trip => `
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
            <button class="edit-trip-btn" onclick="openEditor('${item.id}', '${type}')" style="position:fixed; bottom:20px; right:20px; z-index:100; padding:10px 20px; background:var(--accent-color); border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Edit ${type === 'recipe' ? 'Recipe' : 'Trip'}</button>
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
let currentEditType = 'trip'; // 'trip' or 'recipe'

window.openEditor = function (id, type = 'trip') {
    currentEditType = type;
    editorModal.classList.remove('hidden');
    const data = storage.getData();
    const collection = type === 'recipe' ? data.recipes : data.trips;

    document.getElementById('editor-title').innerText = id ? `Edit ${type === 'recipe' ? 'Recipe' : 'Trip'}` : `New ${type === 'recipe' ? 'Recipe' : 'Trip'}`;

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

function renderEditorBlocks(blocks) {
    editorBlocks.innerHTML = '';
    blocks.forEach((block, index) => {
        const div = document.createElement('div');
        div.className = 'editor-block-item';
        div.innerHTML = `
            <span class="block-type">${block.type.toUpperCase()}</span>
            ${block.type === 'text'
                ? `<textarea class="block-content" rows="3">${block.content}</textarea>`
                : `<input type="text" class="block-content" value="${block.content}" placeholder="Image URL">`
            }
            <button type="button" class="remove-block">&times;</button>
        `;

        div.querySelector('.remove-block').onclick = () => {
            div.remove();
        };
        editorBlocks.appendChild(div);
    });
}

function addBlock(type) {
    const div = document.createElement('div');
    div.className = 'editor-block-item';
    div.innerHTML = `
        <span class="block-type">${type.toUpperCase()}</span>
        ${type === 'text'
            ? `<textarea class="block-content" rows="3"></textarea>`
            : `<input type="text" class="block-content" placeholder="Image URL">`
        }
        <button type="button" class="remove-block">&times;</button>
    `;
    div.querySelector('.remove-block').onclick = () => div.remove();
    editorBlocks.appendChild(div);
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

newTripBtn.onclick = () => {
    mainNav.classList.remove('active');
    openEditor(null, 'trip');
};

closeEditor.onclick = () => editorModal.classList.add('hidden');

// Global Listeners
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
menuToggle.addEventListener('click', () => mainNav.classList.add('active'));
closeNav.addEventListener('click', () => mainNav.classList.remove('active'));
