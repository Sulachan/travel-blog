
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
            { type: 'text', content: "Bangkok's energy was infectious. We got lost in the markets, ate the best Pad Thai of our lives, and marveled at the Grand Palace." },
            { type: 'image', content: "assets/images/sea.png" },
            { type: 'text', content: "Vietnam offered a change of pace with the limestone karsts of Ha Long Bay and the lantern-lit streets of Hoi An." }
        ]
    }
};

// --- Storage Manager ---
const storage = {
    getTrips: () => {
        const stored = localStorage.getItem('travel_trips');
        if (!stored) {
            localStorage.setItem('travel_trips', JSON.stringify(defaultData));
            return defaultData;
        }
        return JSON.parse(stored);
    },
    saveTrip: (trip) => {
        const trips = storage.getTrips();
        trips[trip.id] = trip;
        localStorage.setItem('travel_trips', JSON.stringify(trips));
        return trips;
    },
    deleteTrip: (id) => {
        const trips = storage.getTrips();
        delete trips[id];
        localStorage.setItem('travel_trips', JSON.stringify(trips));
        return trips;
    }
};

// --- Router & Renderer ---
function render() {
    const hash = window.location.hash;
    const trips = storage.getTrips();

    // Update Menu
    renderMenu(trips);

    mainNav.classList.remove('active');

    if (hash.startsWith('#trip/')) {
        const tripId = hash.split('/')[1];
        if (trips[tripId]) {
            renderTrip(trips[tripId]);
        } else {
            renderLanding(trips);
        }
    } else {
        renderLanding(trips);
    }
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

function renderTrip(trip) {
    app.innerHTML = `
        <article class="trip-detail">
            <button class="edit-trip-btn" onclick="openEditor('${trip.id}')" style="position:fixed; bottom:20px; right:20px; z-index:100; padding:10px 20px; background:var(--accent-color); border:none; border-radius:4px; font-weight:bold; cursor:pointer;">Edit Trip</button>
            <header>
                <div class="trip-background">
                    <img src="${trip.coverImage}" alt="${trip.title}">
                </div>
                <div class="date-location">${trip.date} : ${trip.location}</div>
                <h1>${trip.title}</h1>
            </header>
            
            <section class="trip-content">
                <div class="trip-blocks">
                    ${trip.blocks.map(block => {
        if (block.type === 'text') return `<p>${block.content}</p>`;
        if (block.type === 'image') return `<div class="trip-image-block"><img src="${block.content}" alt="Trip Image"></div>`;
        return '';
    }).join('')}
                </div>
            </section>
        </article>
    `;
    window.scrollTo(0, 0);
    document.title = `${trip.title} | Travel Log`;
}

// --- Editor Logic ---
window.openEditor = function (tripId) {
    editorModal.classList.remove('hidden');
    const trips = storage.getTrips();

    if (tripId && trips[tripId]) {
        // Edit Mode
        const trip = trips[tripId];
        document.getElementById('editor-title').innerText = "Edit Trip";
        document.getElementById('edit-id').value = trip.id;
        document.getElementById('edit-title').value = trip.title;
        document.getElementById('edit-date').value = trip.date;
        document.getElementById('edit-location').value = trip.location;
        document.getElementById('edit-cover').value = trip.coverImage;
        deleteTripBtn.classList.remove('hidden');
        renderEditorBlocks(trip.blocks);
    } else {
        // Create Mode
        document.getElementById('editor-title').innerText = "New Trip";
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

    const newTrip = {
        id,
        title: document.getElementById('edit-title').value,
        date: document.getElementById('edit-date').value,
        location: document.getElementById('edit-location').value,
        coverImage: document.getElementById('edit-cover').value,
        blocks
    };

    storage.saveTrip(newTrip);
    editorModal.classList.add('hidden');
    render();
    if (window.location.hash.includes(id)) renderTrip(newTrip); // Refresh if on page
    else window.location.hash = `#trip/${id}`;
};

deleteTripBtn.onclick = () => {
    const id = document.getElementById('edit-id').value;
    if (confirm('Are you sure you want to delete this trip?')) {
        storage.deleteTrip(id);
        editorModal.classList.add('hidden');
        window.location.hash = '#home';
        render();
    }
};

newTripBtn.onclick = () => {
    mainNav.classList.remove('active');
    openEditor(null);
};

closeEditor.onclick = () => editorModal.classList.add('hidden');

// Global Listeners
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
menuToggle.addEventListener('click', () => mainNav.classList.add('active'));
closeNav.addEventListener('click', () => mainNav.classList.remove('active'));
