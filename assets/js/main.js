let map;
let service;
let markers = [];

// Google llama esta función automáticamente
function initMap() {

  const defaultLocation = { lat: 6.2442, lng: -75.5812 }; // Medellín

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 14,
  });

  service = new google.maps.places.PlacesService(map);

  setupEvents();
}

// Eventos
function setupEvents() {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  searchBtn.addEventListener("click", () => {
    const keyword = searchInput.value.trim() || "cafe";
    searchCafes(keyword);
  });
}

// Buscar cafés
function searchCafes(keyword) {

  clearMarkers();
  clearResults();

  const request = {
    location: map.getCenter(),
    radius: 2000,
    keyword: keyword,
    type: ["cafe"],
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      renderResults(results);
      results.forEach(place => createMarker(place));
    } else {
      console.error("Error en búsqueda:", status);
    }
  });
}

// Crear marcador
function createMarker(place) {

  const marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div>
        <strong>${place.name}</strong><br>
        ${place.vicinity}
      </div>
    `
  });

  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });

  markers.push(marker);
}

// Limpiar marcadores
function clearMarkers() {
  markers.forEach(marker => marker.setMap(null));
  markers = [];
}

// Renderizar lista
function renderResults(results) {

  const list = document.getElementById("resultsList");

  results.forEach(place => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${place.name}</strong><br>
      ${place.vicinity}
    `;

    li.addEventListener("click", () => {
      map.setCenter(place.geometry.location);
      map.setZoom(16);
    });

    list.appendChild(li);
  });
}

// Limpiar lista
function clearResults() {
  document.getElementById("resultsList").innerHTML = "";
}