<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { SessionKey } from '../../../../models/sellWizardEnums.ts';
import type { Advertisement } from '../../../../models/advertisement.ts';
import UniversalMapModal from '../../../../components/map/UniversalMapModal.vue';

const emit = defineEmits<{
    (e: 'location-completed', payload: Advertisement): void;
}>();

const advertisementPayload = ref<Partial<Advertisement>>({
    propertyNumber: '',
    areaName: '',
    addressLine1: '',
    addressLine2: '',
    district: '',
    pincode: '',
    latitude: undefined,
    longitude: undefined
});

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');
const isMapModalOpen = ref<boolean>(false);
const isLocationPinned = ref<boolean>(false);

const isFetchingPincode = ref<boolean>(false);
const localitySuggestions = ref<string[]>([]);

onMounted(() => {
    const cachedCentralPayload = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    if (cachedCentralPayload) {
        const structuralData = JSON.parse(cachedCentralPayload);
        advertisementPayload.value = { ...advertisementPayload.value, ...structuralData };
        if (structuralData.latitude != null && structuralData.longitude != null) {
            isLocationPinned.value = true;
        }
    }
});

const isPincodeValid = () => /^\d{6}$/.test((advertisementPayload.value.pincode || '').trim());

const lookupPincodeDetails = async (pincode: string) => {
    isFetchingPincode.value = true;
    localitySuggestions.value = [];

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        const entry = Array.isArray(data) ? data.at(0) : null;

        if (entry?.Status === 'Success' && Array.isArray(entry.PostOffice) && entry.PostOffice.length > 0) {
            const postOffices = entry.PostOffice;
            const firstOffice = postOffices.at(0);

            if (firstOffice?.District) {
                advertisementPayload.value.district = firstOffice.District;
            }

            const uniqueLocalities = new Set<string>();
            for (const po of postOffices) {
                if (po.Name) uniqueLocalities.add(String(po.Name).trim());
                if (po.Block && po.Block !== 'NA' && po.Block !== firstOffice?.District) {
                    uniqueLocalities.add(String(po.Block).trim());
                }
            }

            const localities = Array.from(uniqueLocalities);
            localitySuggestions.value = localities;

            const singleLocality = localities.at(0);
            if (localities.length === 1 && singleLocality) {
                advertisementPayload.value.areaName = singleLocality;
            }
        }
    } catch (err) {
        console.warn('India Post pincode lookup failed or timed out.');
    } finally {
        isFetchingPincode.value = false;
    }
};

const handlePincodeInput = () => {
    const cleaned = (advertisementPayload.value.pincode || '').replace(/\D/g, '').slice(0, 6);
    advertisementPayload.value.pincode = cleaned;

    if (cleaned.length === 6) {
        lookupPincodeDetails(cleaned);
    } else {
        localitySuggestions.value = [];
    }
};

const selectLocalityChip = (locality: string) => {
    advertisementPayload.value.areaName = locality;
};

const fetchPhotonCoordinates = async (query: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
        const geocodeUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=22.5726&lon=88.3639&limit=1`;
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        const firstFeature = data?.features?.at(0);
        if (firstFeature?.geometry?.coordinates?.length === 2) {
            const [lon, lat] = firstFeature.geometry.coordinates;
            return {
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lon.toFixed(6))
            };
        }
    } catch (err) {
        console.warn('Photon lookup timed out for query:', query);
    }
    return null;
};

const triggerOpenMapModal = async () => {
    if (!isLocationPinned.value) {
        const activeArea = advertisementPayload.value.areaName?.trim() || '';
        const activeDistrict = advertisementPayload.value.district?.trim() || '';
        const activePincode = advertisementPayload.value.pincode?.trim() || '';

        let resolvedCoords: { latitude: number; longitude: number } | null = null;

        // 1. Primary lookup: Area Name + District + Pincode for neighborhood-level precision
        if (activeArea) {
            const primaryQuery = [activeArea, activeDistrict, activePincode].filter(Boolean).join(', ');
            resolvedCoords = await fetchPhotonCoordinates(primaryQuery);
        }

        // 2. Fallback lookup: Pincode + West Bengal if primary query missed or areaName is empty
        if (!resolvedCoords && /^\d{6}$/.test(activePincode)) {
            resolvedCoords = await fetchPhotonCoordinates(`${activePincode}, West Bengal, India`);
        }

        if (resolvedCoords) {
            advertisementPayload.value.latitude = resolvedCoords.latitude;
            advertisementPayload.value.longitude = resolvedCoords.longitude;
        }
    }

    isMapModalOpen.value = true;
};

const handleMapLocationConfirmed = (coords: { latitude: number; longitude: number }) => {
    advertisementPayload.value.latitude = coords.latitude;
    advertisementPayload.value.longitude = coords.longitude;
    isLocationPinned.value = true;
    isMapModalOpen.value = false;
};

const handleSaveLocation = () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!isPincodeValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid 6-digit numeric postal Pincode.';
        return;
    }

    if (
        !advertisementPayload.value.district?.trim() ||
        !advertisementPayload.value.areaName?.trim() ||
        !advertisementPayload.value.propertyNumber?.trim()
    ) {
        validationError.value = true;
        errorMessage.value = 'Please complete all required fields: Postal Pincode, City/District, Area Name, and Property Number.';
        return;
    }

    const existingPayload = JSON.parse(sessionStorage.getItem(SessionKey.ADVERTISEMENT) || '{}');

    const intermediateAdvertisement: Advertisement = {
        ...existingPayload,
        pincode: advertisementPayload.value.pincode!.trim(),
        district: advertisementPayload.value.district.trim(),
        areaName: advertisementPayload.value.areaName.trim(),
        addressLine1: advertisementPayload.value.addressLine1?.trim() || '',
        addressLine2: advertisementPayload.value.addressLine2?.trim() || '',
        propertyNumber: advertisementPayload.value.propertyNumber.trim(),
        latitude: advertisementPayload.value.latitude,
        longitude: advertisementPayload.value.longitude
    };

    emit('location-completed', intermediateAdvertisement);
};
</script>


<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone animate-fade-in">
        <!-- 1. POSTAL PINCODE -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isPincodeValid() }">
            <div class="flat-field-labeled-stack no-icon">
                <span class="flat-field-top-label">
                    Postal Pincode {{ isFetchingPincode ? '(Fetching location...)' : '' }}
                </span>
                <input type="text" class="flat-raw-input" placeholder="6-digit numeric pincode"
                    v-model="advertisementPayload.pincode" maxlength="6" @input="handlePincodeInput" />
            </div>
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 2. CITY / DISTRICT -->
        <div class="flat-form-field"
            :class="{ 'is-invalid-field': validationError && !advertisementPayload.district?.trim() }">
            <div class="flat-field-labeled-stack no-icon">
                <span class="flat-field-top-label">City / District</span>
                <input type="text" class="flat-raw-input" placeholder="e.g. Kolkata"
                    v-model="advertisementPayload.district" />
            </div>
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 3. AREA NAME / LOCALITY + CLICKABLE CHIPS -->
        <div class="vertical-input-group">
            <div class="flat-form-field"
                :class="{ 'is-invalid-field': validationError && !advertisementPayload.areaName?.trim() }">
                <div class="flat-field-labeled-stack no-icon">
                    <span class="flat-field-top-label">Area Name / Locality</span>
                    <input type="text" class="flat-raw-input" placeholder="e.g. Sector V, Salt Lake"
                        v-model="advertisementPayload.areaName" />
                </div>
            </div>

            <div v-if="localitySuggestions.length > 0" class="locality-chips-row animate-fade-in">
                <button v-for="locality in localitySuggestions" :key="locality" type="button"
                    class="locality-suggestion-chip"
                    :class="{ 'is-selected-chip': advertisementPayload.areaName === locality }"
                    @click="selectLocalityChip(locality)">
                    {{ locality }}
                </button>
            </div>
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 4. ADDRESS LINE 1 -->
        <div class="flat-form-field">
            <div class="flat-field-labeled-stack no-icon">
                <span class="flat-field-top-label">Address Line 1 (Optional)</span>
                <input type="text" class="flat-raw-input" placeholder="Street name, block, or building name"
                    v-model="advertisementPayload.addressLine1" />
            </div>
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 5. ADDRESS LINE 2 -->
        <div class="flat-form-field">
            <div class="flat-field-labeled-stack no-icon">
                <span class="flat-field-top-label">Address Line 2 (Optional)</span>
                <input type="text" class="flat-raw-input" placeholder="Landmark or nearby junction"
                    v-model="advertisementPayload.addressLine2" />
            </div>
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 6. PROPERTY / HOLDING NUMBER -->
        <div class="flat-form-field"
            :class="{ 'is-invalid-field': validationError && !advertisementPayload.propertyNumber?.trim() }">
            <div class="flat-field-labeled-stack no-icon">
                <span class="flat-field-top-label">Property / Holding Number</span>
                <input type="text" class="flat-raw-input" placeholder="e.g. Premise 42-A"
                    v-model="advertisementPayload.propertyNumber" />
            </div>
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 7. POPUP MAP LINK TRIGGER ACTION (OPTIONAL) -->
        <div class="map-trigger-row">
            <a href="#" @click.prevent="triggerOpenMapModal" class="map-popup-trigger-link">
                📍 Pin the location on map (Optional)
            </a>
            <span v-if="isLocationPinned" class="coordinates-saved-badge">
                ✓ Pin Confirmed (Lat: {{ advertisementPayload.latitude }}, Lng: {{ advertisementPayload.longitude }})
            </span>
        </div>

        <!-- REUSABLE COMPONENT BOUNDARY -->
        <UniversalMapModal :isOpen="isMapModalOpen" :latitude="advertisementPayload.latitude || 22.5726"
            :longitude="advertisementPayload.longitude || 88.3639" @close="isMapModalOpen = false"
            @confirm="handleMapLocationConfirmed" />

        <!-- CORE ERROR ALERTS MODIFIER -->
        <div v-if="validationError" class="filter-vertical-row remove-bottom-gap">
            <span class="flat-error-descriptor-text shake-error-cue">{{ errorMessage }}</span>
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- MAIN SAVE ACTION TRIGGER BUTTON -->
        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveLocation" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                <span class="btn-label-text">Save Location Details</span>
            </button>
        </div>
    </div>
</template>
<style scoped>
.vertical-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.locality-chips-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 2px;
}

.locality-suggestion-chip {
    background: transparent;
    border: 1.5px solid rgba(0, 118, 223, 0.25);
    color: var(--text-color);
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition-smooth);
}

.locality-suggestion-chip:hover,
.locality-suggestion-chip.is-selected-chip {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: #ffffff;
}

.map-trigger-row {
    padding: 4px 0 12px 0;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.map-popup-trigger-link {
    font-size: 13.5px;
    font-weight: 700;
    color: #0076df;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}

.map-popup-trigger-link:hover {
    text-decoration: underline;
}

.coordinates-saved-badge {
    font-size: 12px;
    color: #2ecc71;
    font-weight: 700;
    background-color: rgba(46, 204, 113, 0.06);
    border: 1px solid rgba(46, 204, 113, 0.15);
    padding: 3px 10px;
    border-radius: 6px;
}
</style>

