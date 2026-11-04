<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';
// @ts-ignore
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = withDefaults(defineProps<{
    isOpen: boolean;
    latitude: number;
    longitude: number;
    readOnly?: boolean;
}>(), {
    readOnly: false
});

const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'confirm', payload: { latitude: number; longitude: number }): void;
}>();

// --- Isolated Map States ---
const stagedLat = ref<number>(props.latitude || 22.5726);
const stagedLng = ref<number>(props.longitude || 88.3639);
const mapSearchQuery = ref<string>('');
const searchSuggestions = ref<any>();
const isSearching = ref<boolean>(false);
const showSuggestionsDropdown = ref<boolean>(false);
let debounceTimeout: any = null;

let mapInstance: any = null;
let markerInstance: any = null;

const westBengalBounds = L.latLngBounds(
    L.latLng(21.3, 85.8),
    L.latLng(27.4, 89.9)
);

const initializeFreeLeafletMap = () => {
    const mapElement = document.getElementById('universal-leaflet-canvas');
    if (!mapElement || mapInstance) return;

    const redPinIcon = L.divIcon({
        className: 'custom-houseilla-marker',
        html: `
          <svg xmlns="http://w3.org" viewBox="0 0 512 512" style="width: 32px; height: 32px; filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.4));">
            <path d="M256 32c-88.22 0-160 68.65-160 153 0 40.17 18.31 93.59 54.42 158.78 29 52.34 62.55 99.67 80 123.22a31.75 31.75 0 0 0 51.22 0c17.42-23.55 51-70.88 80-123.22 35.63-65.19 54.42-121.19 54.42-158.78 0-84.35-71.78-153-160-153zm0 224a64 64 0 1 1 64-64 64.07 64.07 0 0 1-64 64z" fill="#e63946" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>
            <circle cx="256" cy="192" r="44" fill="#ffffff" />
          </svg>
        `,
        iconSize: [28, 28],
        iconAnchor: [16, 32]
    });

    mapInstance = L.map('universal-leaflet-canvas', {
        center: [stagedLat.value, stagedLng.value],
        zoom: 14,
        minZoom: 7,
        maxBounds: westBengalBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: false,       // 🌟 1. Manual zoom control button panel removed completely
        scrollWheelZoom: true     // 🌟 3. Re-enabled natural interaction scrolling
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    markerInstance = L.marker([stagedLat.value, stagedLng.value], {
        icon: redPinIcon,
        draggable: !props.readOnly
    }).addTo(mapInstance);

    if (!props.readOnly) {
        markerInstance.on('dragend', () => {
            const pos = markerInstance.getLatLng();
            if (westBengalBounds.contains(pos)) {
                stagedLat.value = parseFloat(pos.lat.toFixed(6));
                stagedLng.value = parseFloat(pos.lng.toFixed(6));
            } else {
                markerInstance.setLatLng([stagedLat.value, stagedLng.value]);
            }
        });

        mapInstance.on('click', (e: any) => {
            if (westBengalBounds.contains(e.latlng)) {
                markerInstance.setLatLng(e.latlng);
                stagedLat.value = parseFloat(e.latlng.lat.toFixed(6));
                stagedLng.value = parseFloat(e.latlng.lng.toFixed(6));
            }
        });
    }
};

const destroyMap = () => {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
        markerInstance = null;
    }
};

watch(() => props.isOpen, async (newValue) => {
    if (newValue) {
        stagedLat.value = props.latitude || 22.5726;
        stagedLng.value = props.longitude || 88.3639;
        await nextTick();
        initializeFreeLeafletMap();
    } else {
        destroyMap();
    }
}, { immediate: true });

onUnmounted(() => {
    destroyMap();
});

const handleMapAddressSearchQuery = () => {
    showSuggestionsDropdown.value = false;
    const inputString = mapSearchQuery.value.trim();
    if (inputString.length < 3) {
        searchSuggestions.value = null;
        return;
    }

    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        isSearching.value = true;
        try {
            const optimizedQuery = `${inputString}, West Bengal`;
            const biasQueryUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(optimizedQuery)}&limit=8`;
            const response = await fetch(biasQueryUrl);
            const data = await response.json();

            if (data && data.features) {
                searchSuggestions.value = data.features.map((feature: any) => {
                    const propsData = feature.properties;
                    return {
                        label: [propsData.name, propsData.city || propsData.district, propsData.state || ''].filter(Boolean).join(', '),
                        coordinates: feature.geometry.coordinates
                    };
                });
                showSuggestionsDropdown.value = searchSuggestions.value.length > 0;
            }
        } catch (error) {
            console.error('Lookup faulted:', error);
            searchSuggestions.value = null;
        } finally {
            isSearching.value = false;
        }
    }, 350);
};

const handleSelectSuggestionItem = (item: any) => {
    mapSearchQuery.value = item.label;
    if (item.coordinates && item.coordinates.length === 2) {
        const [lon, lat] = item.coordinates;
        stagedLat.value = parseFloat(lat.toFixed(6));
        stagedLng.value = parseFloat(lon.toFixed(6));

        if (mapInstance && markerInstance) {
            mapInstance.setView([lat, lon], mapInstance.getZoom());
            markerInstance.setLatLng([lat, lon]);
        }
    }
    showSuggestionsDropdown.value = false;
    searchSuggestions.value = null;
};

const handleConfirmSelection = () => {
    emit('confirm', { latitude: stagedLat.value, longitude: stagedLng.value });
};
</script>


<template>
    <div v-if="isOpen" class="fullscreen-map-popup-overlay">

        <!-- HUD CONTROLS OVERLAY ROW -->
        <div class="top-floating-hud-row">
            <div class="hud-search-field-wrapper" :style="readOnly ? 'visibility: hidden;' : ''">
                <svg class="hud-search-vector" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" class="hud-raw-text-input" placeholder="Search address to pin..."
                    v-model="mapSearchQuery" @input="handleMapAddressSearchQuery" />
                <span v-if="isSearching" class="hud-spinner-icon">⏳</span>

                <button type="button" @click.stop="handleConfirmSelection" class="hud-embedded-pin-btn">📍 Confirm
                    Pin</button>

                <!-- Suggestions Dropdown -->
                <div v-if="showSuggestionsDropdown" class="autocomplete-popover-dropdown">
                    <div v-for="(suggestion, i) in searchSuggestions" :key="i" class="autocomplete-option-row"
                        @click="handleSelectSuggestionItem(suggestion)">
                        📍 {{ suggestion.label }}
                    </div>
                </div>
            </div>

            <!-- Sleek Close Icon Trigger -->
            <button type="button" class="hud-close-icon-only-trigger" @click="emit('close')" title="Close Map">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>

        <div id="universal-leaflet-canvas" class="live-leaflet-canvas-core"></div>
    </div>
</template>

<style scoped>
/* =====================================================================
   1. EDGE-TO-EDGE ABSOLUTE SCREEN POPUP OVERLAY LAYOUTS
   ===================================================================== */
.fullscreen-map-popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #0f172a;
    z-index: 9999999 !important;
    display: flex;
    flex-direction: column;
}

.live-leaflet-canvas-core {
    width: 100%;
    height: 100%;
    z-index: 1;
}

/* =====================================================================
   2. FLOATING TOP HUD CONTROL PANEL (SYMMETRICAL PAD EXTENSION)
   ===================================================================== */
.top-floating-hud-row {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 999999;
    width: calc(100% - 40px);
}

.hud-search-field-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    background-color: #1e2530;
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    border-radius: 8px;
    padding: 0 8px 0 14px;
    height: 46px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.hud-search-vector {
    width: 16px;
    height: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-right: 10px;
    flex-shrink: 0;
}

.hud-raw-text-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    padding-right: 8px;
}

.hud-spinner-icon {
    font-size: 13px;
    margin-left: 6px;
    color: rgba(255, 255, 255, 0.7);
}

.hud-embedded-pin-btn {
    background-color: #2ecc71;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 0 16px;
    height: 34px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 4px 10px rgba(46, 204, 113, 0.2);
    transition: background 0.15s ease;
}

.hud-embedded-pin-btn:hover {
    background-color: #27ae60;
}

/* =====================================================================
   3. 🌟 2. RESTORED: RED ACTION CLOSE TRIGGER BRANDING STYLE RULES
   ===================================================================== */
.hud-close-icon-only-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    background-color: #e74c3c;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 10px 25px -5px rgba(231, 76, 60, 0.3);
    transition: background 0.15s ease, transform 0.1s ease;
    flex-shrink: 0;
}

.hud-close-icon-only-trigger:hover {
    background-color: #c0392b;
}

.hud-close-icon-only-trigger:active {
    transform: scale(0.96);
}

/* =====================================================================
   4. AUTOCOMPLETE RECOMMENDATIONS POPOVER PANEL
   ===================================================================== */
.autocomplete-popover-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    background: #1e2530;
    border: 1px solid #334155;
    border-radius: 8px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    max-height: 220px;
    overflow-y: auto;
}

.autocomplete-option-row {
    padding: 11px 14px;
    cursor: pointer;
    font-size: 13px;
    color: #cbd5e1;
    transition: background 0.15s ease;
    text-align: left;
}

.autocomplete-option-row:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
}

:deep(.custom-houseilla-marker) {
    background: none !important;
    border: none !important;
}

.flat-validation-alert {
    border-color: #ea580c !important;
    background-color: rgba(234, 88, 12, 0.02) !important;
}

/* =====================================================================
   📱 MOBILE HUD LAYOUT QUERIES
   ===================================================================== */
@media (max-width: 640px) {
    .top-floating-hud-row {
        top: 12px;
        left: 12px;
        right: 12px;
        width: calc(100% - 24px);
        gap: 8px;
    }

    .hud-search-field-wrapper {
        height: 42px;
        padding: 0 6px 0 10px;
    }

    .hud-raw-text-input {
        font-size: 12.5px;
    }

    .hud-embedded-pin-btn {
        height: 30px;
        padding: 0 10px;
        font-size: 11px;
    }

    .hud-close-icon-only-trigger {
        width: 42px;
        height: 42px;
    }
}
</style>
