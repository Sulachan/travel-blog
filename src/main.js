import './style.css'
import tripsData from './data/trips.json';

// Since we are in a vanilla environment without JSON import support (standard), 
// Vite handles it, but just in case, we are importing it.
// If not using a bundler that supports JSON imports, we would fetch it.
// But we are assuming Vite structure.

document.querySelector('#app').innerHTML = `
  <h1>The Traveler's Log</h1>
  <div id="trips-container"></div>
`

const renderTrips = (trips) => {
  const container = document.getElementById('trips-container');
  
  trips.forEach(trip => {
    const tripSection = document.createElement('div');
    tripSection.className = 'trip-section';
    
    tripSection.innerHTML = `
      <h2 class="trip-title">${trip.title}</h2>
      <div class="trip-days">
        ${trip.days.map((day, index) => `
          <div class="day-entry" id="day-${trip.id}-${index}">
            <div class="day-header" onclick="toggleDay('day-${trip.id}-${index}')">
              <span class="day-date">${day.date}</span>
              <span class="day-title">${day.title}</span>
            </div>
            <div class="day-content">
              <p class="day-text">${day.content}</p>
              <div class="day-images">
                <!-- Images would go here -->
                 ${day.images.map(img => `<img src="${img}" class="day-img" />`).join('')}
                 <!-- Placeholder if no images -->
                 ${day.images.length === 0 ? '<div style="width:100px; height:100px; background:rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center; transform:rotate(3deg); border:3px solid white;">No Photos</div>' : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    container.appendChild(tripSection);
  });
}

// Global exposure for onclick
window.toggleDay = (id) => {
  const element = document.getElementById(id);
  element.classList.toggle('open');
}

renderTrips(tripsData);
