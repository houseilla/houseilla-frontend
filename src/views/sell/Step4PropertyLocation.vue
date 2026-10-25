<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

// @ts-ignore
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const emit = defineEmits<{
    (e: 'sync-step-number', step: number): void;
    (e: 'location-completed'): void;
}>();

const locationForm = ref({
    propertyNumber: '',
    areaName: '',
    addressLine1: '',
    addressLine2: '',
    district: '',
    pincode: '',
    latitude: 22.5726,
    longitude: 88.3639
});

const mapSearchQuery = ref<string>('');
const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');

const searchSuggestions = ref<any[]>([]);
const isSearching = ref<boolean>(false);
const showSuggestionsDropdown = ref<boolean>(false);
let debounceTimeout: any = null;

let mapInstance: any = null;
let markerInstance: any = null;

const westBengalBounds = L.latLngBounds(
    L.latLng(21.3, 85.8),
    L.latLng(27.4, 89.9)
);

onMounted(async () => {
    emit('sync-step-number', 4);
    const cachedInputs = sessionStorage.getItem('houseilla_step4_inputs');
    if (cachedInputs) {
        locationForm.value = JSON.parse(cachedInputs);
    }
    await nextTick();
    setTimeout(() => {
        initializeFreeLeafletMap();
    }, 250);
});

const cacheLocationInputs = () => {
    sessionStorage.setItem('houseilla_step4_inputs', JSON.stringify(locationForm.value));
};

const initializeFreeLeafletMap = () => {
    const mapElement = document.getElementById('houseilla-free-leaflet-map');
    if (!mapElement || mapInstance) return;

    const redPinIcon = L.divIcon({
        className: 'custom-houseilla-marker',
        html: `
      <svg xmlns="http://w3.org" viewBox="0 0 512 512" style="width: 28px; height: 28px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
        <path d="M256 32c-88.22 0-160 68.65-160 153 0 40.17 18.31 93.59 54.42 158.78 29 52.34 62.55 99.67 80 123.22a31.75 31.75 0 0 0 51.22 0c17.42-23.55 51-70.88 80-123.22 35.63-65.19 54.42-121.19 54.42-158.78 0-84.35-71.78-153-160-153zm0 224a64 64 0 1 1 64-64 64.07 64.07 0 0 1-64 64z" fill="#e63946" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
        <circle cx="256" cy="192" r="44" fill="#ffffff" />
      </svg>
    `,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
    });

    mapInstance = L.map('houseilla-free-leaflet-map', {
        center: [locationForm.value.latitude, locationForm.value.longitude],
        zoom: 13,
        minZoom: 7,
        maxBounds: westBengalBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false // Disables default zoom buttons
    });

    // Re-injects zoom buttons onto the bottom-left edge
    L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    markerInstance = L.marker([locationForm.value.latitude, locationForm.value.longitude], {
        icon: redPinIcon,
        draggable: true
    }).addTo(mapInstance);

    mapInstance.invalidateSize();

    markerInstance.on('dragend', () => {
        const positionSnapshot = markerInstance.getLatLng();
        if (!westBengalBounds.contains(positionSnapshot)) {
            markerInstance.setLatLng([22.5726, 88.3639]);
            locationForm.value.latitude = 22.5726;
            locationForm.value.longitude = 88.3639;
        } else {
            locationForm.value.latitude = parseFloat(positionSnapshot.lat.toFixed(6));
            locationForm.value.longitude = parseFloat(positionSnapshot.lng.toFixed(6));
        }
        cacheLocationInputs();
    });

    mapInstance.on('click', (e: any) => {
        if (westBengalBounds.contains(e.latlng)) {
            markerInstance.setLatLng(e.latlng);
            locationForm.value.latitude = parseFloat(e.latlng.lat.toFixed(6));
            locationForm.value.longitude = parseFloat(e.latlng.lng.toFixed(6));
            cacheLocationInputs();
        }
    });
};

// 2. HIGH-RELIABILITY AUTOCOMPLETE PIPELINE (WITH EXPLICIT CONSOLE LOG TRACING)
const handleMapAddressSearchQuery = () => {
    showSuggestionsDropdown.value = false;
    const inputString = mapSearchQuery.value.trim();

    console.log(`[Step 4 Trace] 🎹 Keystroke Intercepted. Current search buffer: "${inputString}"`);

    if (inputString.length < 3) {
        console.warn(`[Step 4 Trace] ⚠️ Input text length (${inputString.length}) is below the required 3 characters threshold. Halting request.`);
        searchSuggestions.value = [];
        return;
    }

    if (debounceTimeout) clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(async () => {
        isSearching.value = true;
        try {
            const optimizedQuery = `${inputString}, West Bengal`;

            // FIXED SYNTAX: Injected the missing '$' token and corrected the API endpoint pathway address
            const biasQueryUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(optimizedQuery)}&limit=10`;
            //https://photon.komoot.io/api/?q=berlin&limit=10

            console.log(`[Step 4 Trace] 🚀 Dispatching background network fetch() call to URL: ${biasQueryUrl}`);

            const response = await fetch(biasQueryUrl);
            console.log(`[Step 4 Trace] 📡 Server responded with HTTP status code: ${response.status}`);

            const data = await response.json();
            console.log(`[Step 4 Trace] 📦 Raw JSON Data parsed successfully. Found ${data.features ? data.features.length : 0} geographical features.`);

            if (data && data.features) {
                searchSuggestions.value = data.features.map((feature: any) => {
                    const props = feature.properties;

                    const name = props.name || '';
                    const city = props.city || props.district || props.locality || '';
                    const state = props.state || '';

                    const labelParts = [name];
                    if (city && city !== name) labelParts.push(city);
                    if (state) labelParts.push(state);

                    return {
                        label: labelParts.join(', '),
                        city: city || name || '',
                        postcode: props.postcode || '',
                        coordinates: feature.geometry.coordinates // [longitude, latitude]
                    };
                });

                console.log(`[Step 4 Trace] ✨ Successfully compiled ${searchSuggestions.value.length} matching suggestion rows for the UI view list wrapper.`);
                showSuggestionsDropdown.value = searchSuggestions.value.length > 0;
            }
        } catch (error) {
            console.error('[Step 4 Trace] ❌ Critical Exception: Autocomplete execution crashed!', error);
            searchSuggestions.value = [];
        } finally {
            isSearching.value = false;
            console.log('[Step 4 Trace] 🏁 Search execution thread concluded. Loading flag reset.');
        }
    }, 350);
};


// 3. SELECTION DROP DOWN AUTO FILL HOOK (WITH TRACING)
const handleSelectSuggestionItem = (item: any) => {
    console.log("%c[Step 4 Trace] 🎯 User clicked/selected location item row:", "color: #0076df; font-weight: bold;", item);

    mapSearchQuery.value = item.label;

    // Auto-populate form input properties cleanly
    if (item.city) {
        locationForm.value.district = item.city;
        console.log("%c[Step 4 Trace] 📝 Form Autofill -> City / District field updated to:", "color: #16a34a;", item.city);
    }
    if (item.postcode) {
        locationForm.value.pincode = item.postcode;
        console.log("%c[Step 4 Trace] 📝 Form Autofill -> Pincode field updated to:", "color: #16a34a;", item.postcode);
    }

    if (item.coordinates && item.coordinates.length === 2) {
        const [lon, lat] = item.coordinates;
        locationForm.value.latitude = parseFloat(lat.toFixed(6));
        locationForm.value.longitude = parseFloat(lon.toFixed(6));
        console.log(`%c[Step 4 Trace] 📝 Form Geolocation Sync -> Extracted Coordinates vector markers set to: [Lat: ${locationForm.value.latitude}, Lng: ${locationForm.value.longitude}]`, "color: #16a34a;");

        if (mapInstance && markerInstance) {
            console.log("%c[Step 4 Trace] 🗺️ Map Repositioning -> Panning camera and moving pin crosshair to index coordinate axis center...", "color: #0076df;");
            mapInstance.setView([lat, lon], 15);
            markerInstance.setLatLng([lat, lon]);
            setTimeout(() => {
                mapInstance.invalidateSize();
                console.log("%c[Step 4 Trace] 🗺️ Map Refreshed -> Boundary container sizes forced to invalidateSize metric sync windows.", "color: #64748b;");
            }, 50);
        } else {
            console.log("%c[Step 4 Trace] ⚠️ Map instances are currently missing or uninitialized. Skipping canvas adjustment operations.", "color: #ea580c;");
        }
    }

    showSuggestionsDropdown.value = false;
    searchSuggestions.value = [];
    cacheLocationInputs();
};


const handleSaveLocation = () => {
    validationError.value = false;
    if (!locationForm.value.propertyNumber.trim() ||
        !locationForm.value.areaName.trim() ||
        !locationForm.value.district.trim() ||
        !/^\d{6}$/.test(locationForm.value.pincode.trim())) {
        validationError.value = true;
        errorMessage.value = 'Please complete all required fields correctly (Pincode must be 6 digits).';
        return;
    }
    sessionStorage.setItem('houseilla_step4_final_payload', JSON.stringify(locationForm.value));
    emit('location-completed');
};
</script>
<template>
    <div class="vertical-stack-form" @click="showSuggestionsDropdown = false">

        <!-- INPUT UTILITY FLOW -->
        <div class="flat-form-field">
            <input type="text" class="flat-raw-input" placeholder="Property / Holding Number (e.g. Premise 42-A)"
                v-model="locationForm.propertyNumber" @input="cacheLocationInputs" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field">
            <input type="text" class="flat-raw-input" placeholder="Area Name / Locality (e.g. Sector V)"
                v-model="locationForm.areaName" @input="cacheLocationInputs" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field">
            <input type="text" class="flat-raw-input" placeholder="Address Line 1 (Optional)"
                v-model="locationForm.addressLine1" @input="cacheLocationInputs" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field">
            <input type="text" class="flat-raw-input" placeholder="Address Line 2 (Optional)"
                v-model="locationForm.addressLine2" @input="cacheLocationInputs" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field">
            <input type="text" class="flat-raw-input" placeholder="City / District" v-model="locationForm.district"
                @input="cacheLocationInputs" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field">
            <input type="text" class="flat-raw-input" placeholder="6-Digit Postal Pincode"
                v-model="locationForm.pincode" maxlength="6"
                @input="locationForm.pincode = locationForm.pincode.replace(/\D/g, ''); cacheLocationInputs();" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- MAP VIEWPORT CONTAINER -->
        <div class="map-render-wrapper-box" style="position: relative;">

            <!-- FLOATING SEARCH BAR -->
            <div class="floating-map-search-anchor-box">
                <div class="flat-form-field">
                    <input type="text" class="flat-raw-input" placeholder="Search address to pin..."
                        v-model="mapSearchQuery" @input="handleMapAddressSearchQuery"
                        @focus="showSuggestionsDropdown = searchSuggestions.length > 0" @click.stop />
                    <span v-if="isSearching" style="font-size: 14px;">⏳</span>
                </div>

                <div v-if="showSuggestionsDropdown" class="autocomplete-popover-dropdown" @click.stop>
                    <div v-for="(suggestion, index) in searchSuggestions" :key="index" class="autocomplete-option-row"
                        @click="handleSelectSuggestionItem(suggestion)">
                        📍 {{ suggestion.label }}
                    </div>
                </div>
            </div>

            <div id="houseilla-free-leaflet-map" class="live-leaflet-canvas-core"></div>
        </div>

        <!-- ALERT FOOTER MODULE -->
        <div v-if="validationError" style="color: #ea580c; font-size: 13px; font-weight: 600; padding: 4px;">
            {{ errorMessage }}
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveLocation" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    style="width: 16px; height: 16px; margin-right: 8px; display: inline-block; vertical-align: middle;">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                <span class="btn-text-label" style="vertical-align: middle;">Save Location Details</span>
            </button>
        </div>

    </div>
</template>
<style scoped>
.map-render-wrapper-box {
    width: 100%;
    height: 280px;
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid rgba(0, 0, 0, 0.15);
}

.live-leaflet-canvas-core {
    width: 100%;
    height: 100%;
}

.floating-map-search-anchor-box {
    position: absolute;
    top: 12px;
    left: 12px;
    /* Pulls search bar inward from zoom buttons */
    right: 12px;
    z-index: 1000;
}

.floating-map-search-anchor-box .autocomplete-popover-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    margin-top: 4px;
}

.autocomplete-popover-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    /* Elevated shadow mapping */
    z-index: 99999 !important;
    /* FIXED: Forces list items to stay stacked visually on top of map tiles */
    max-height: 180px;
    overflow-y: auto;
    margin-top: 4px;
}

[data-theme="dark"] .autocomplete-popover-dropdown {
    background: #1e2530;
    border-color: #334155;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.autocomplete-option-row {
    padding: 10px 12px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-color);
}

.autocomplete-option-row:hover {
    background: rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .autocomplete-option-row:hover {
    background: rgba(255, 255, 255, 0.04);
}

:deep(.custom-houseilla-marker) {
    background: none !important;
    border: none !important;
}
</style>
