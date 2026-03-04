/**
 * Coffee Finder Pro - Lógica de Negocio Final
 */

let map;
let markers = {}; 

// 1. Inicialización del Mapa
function initMap() {
    map = L.map('map', {
        zoomControl: false 
    }).setView([6.2442, -75.5812], 14);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Usamos una capa más clara para que resalten los marcadores de café
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    setupEvents();
}

// 2. Configuración de Eventos
function setupEvents() {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.getElementById("searchInput");

    const handleSearch = () => {
        const keyword = searchInput.value.trim() || "coffee";
        searchCafes(keyword);
    };

    searchBtn.addEventListener("click", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

// 3. Búsqueda con Overpass API (Versión Mejorada para Marcas)
async function searchCafes(keyword) {
    const list = document.getElementById("resultsList");
    const countLabel = document.getElementById("resultCount");

    clearMarkers();
    list.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Buscando "${keyword}"...</p>
        </div>`;

    const bounds = map.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    
    /**
     * MEJORA DE CONSULTA:
     * 1. Usamos [~"name|brand"~"${keyword}",i] para buscar en nombre o marca sin importar mayúsculas.
     * 2. Buscamos tanto amenidades (cafés) como tiendas que tengan cocina de café.
     */
    const query = `[out:json][timeout:25];
        (
          nwr["amenity"~"cafe|restaurant"]["name"~"${keyword}",i](${bbox});
          nwr["brand"~"${keyword}",i](${bbox});
          nwr["name"~"${keyword}",i](${bbox});
        );
        out center;`;
    
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error en la red");
        
        const data = await response.json();
        const elements = data.elements || [];

        list.innerHTML = ""; 
        countLabel.innerText = `${elements.length} lugares encontrados`;

        if (elements.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search-minus"></i>
                    <p>No encontramos "${keyword}". <br><small>Prueba moviendo el mapa a otra zona.</small></p>
                </div>`;
            return;
        }

        elements.forEach(place => {
            const lat = place.lat || place.center.lat;
            const lon = place.lon || place.center.lon;
            
            // Prioridad de nombre: Nombre específico > Marca > Genérico
            const name = place.tags.name || place.tags.brand || "Cafetería";
            
            // Construcción de dirección más inteligente
            const street = place.tags["addr:street"] || "";
            const houseNum = place.tags["addr:housenumber"] || "";
            const suburb = place.tags["addr:suburb"] || place.tags["note"] || "Medellín";
            
            const address = street ? `${street} ${houseNum}` : suburb;

            createMarker(lat, lon, name, place.id);
            renderCard(lat, lon, name, address, place.id);
        });

    } catch (error) {
        console.error("Error:", error);
        list.innerHTML = `<div class="empty-state"><p>Error al conectar con el servidor. Revisa tu internet.</p></div>`;
    }
}

// 4. Crear Marcadores
function createMarker(lat, lon, name, id) {
    const marker = L.marker([lat, lon]).addTo(map);
    marker.bindPopup(`
        <div style="font-family: 'Inter', sans-serif; padding: 5px;">
            <strong style="color: #6f4e37; font-size: 14px;">${name}</strong><br>
            <span style="color: #666; font-size: 12px;">Café seleccionado</span>
        </div>
    `);
    markers[id] = marker;
}

// 5. Renderizar Tarjetas en el Panel Lateral
function renderCard(lat, lon, name, address, id) {
    const list = document.getElementById("resultsList");
    const card = document.createElement("div");
    card.className = "cafe-card";
    
    card.innerHTML = `
        <h3><i class="fas fa-mug-hot"></i> ${name}</h3>
        <p><i class="fas fa-map-marker-alt"></i> ${address}</p>
    `;

    card.addEventListener("click", () => {
        // Hacemos un zoom suave al lugar
        map.flyTo([lat, lon], 17, {
            duration: 1.5
        });
        
        // Esperamos un poco a que termine el movimiento para abrir el popup
        setTimeout(() => {
            if (markers[id]) {
                markers[id].openPopup();
            }
        }, 1500);
    });

    list.appendChild(card);
}

// 6. Limpieza
function clearMarkers() {
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};
}

window.onload = initMap;