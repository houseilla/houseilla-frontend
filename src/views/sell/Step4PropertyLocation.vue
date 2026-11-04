<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { SessionKey } from '../../models/sellWizardEnums';
import type { Advertisement } from '../../models/advertisement';
import UniversalMapModal from '../UniversalMapModal.vue'; // Reusable modal

const emit = defineEmits<{
    (e: 'location-completed', payload: Advertisement): void;
}>();

const advertisementPayload = ref<Partial<Advertisement>>({
    propertyNumber: '', areaName: '', addressLine1: '', addressLine2: '', district: '', pincode: '', latitude: undefined, longitude: undefined
});

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');
const isMapModalOpen = ref<boolean>(false);
const isLocationPinned = ref<boolean>(false);

onMounted(() => {
    const cachedCentralPayload = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    if (cachedCentralPayload) {
        const structuralData = JSON.parse(cachedCentralPayload);
        advertisementPayload.value = { ...advertisementPayload.value, ...structuralData };
        if (structuralData.latitude && structuralData.longitude) {
            isLocationPinned.value = true;
        }
    }
});

const syncInputsToSessionCache = () => {
    const cachedCentralPayload = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    const masterPayload = cachedCentralPayload ? JSON.parse(cachedCentralPayload) : {};
    const consolidatedUpdate = {
        ...masterPayload,
        propertyNumber: advertisementPayload.value.propertyNumber?.trim() || '',
        areaName: advertisementPayload.value.areaName?.trim() || '',
        addressLine1: advertisementPayload.value.addressLine1?.trim() || '',
        addressLine2: advertisementPayload.value.addressLine2?.trim() || '',
        district: advertisementPayload.value.district?.trim() || '',
        pincode: advertisementPayload.value.pincode?.trim() || '',
        latitude: advertisementPayload.value.latitude,
        longitude: advertisementPayload.value.longitude
    };
    sessionStorage.setItem(SessionKey.ADVERTISEMENT, JSON.stringify(consolidatedUpdate));
};

const handleMapLocationConfirmed = (coords: { latitude: number; longitude: number }) => {
    advertisementPayload.value.latitude = coords.latitude;
    advertisementPayload.value.longitude = coords.longitude;
    isLocationPinned.value = true;
    syncInputsToSessionCache();
    isMapModalOpen.value = false;
};

const triggerOpenMapModal = async () => {
    const activePincode = advertisementPayload.value.pincode?.trim() || '';
    const hasValidPincodeInput = /^\d{6}$/.test(activePincode);

    // Dynamic camera optimization bias based on form input pincode details before opening
    if (hasValidPincodeInput && !isLocationPinned.value) {
        try {
            const geocodeUrl = `https://komoot.io{encodeURIComponent(activePincode + ', West Bengal')}&limit=1`;
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            if (data && data.features && data.features.length > 0) {
                const [lon, lat] = data.features[0].geometry.coordinates;
                advertisementPayload.value.latitude = parseFloat(lat.toFixed(6));
                advertisementPayload.value.longitude = parseFloat(lon.toFixed(6));
            }
        } catch (err) {
            console.warn('Pre-center pin lookup timed out.');
        }
    }
    isMapModalOpen.value = true;
};

const isPincodeValid = () => /^\d{6}$/.test((advertisementPayload.value.pincode || '').trim());

const handleSaveLocation = () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!advertisementPayload.value.propertyNumber?.trim() || !advertisementPayload.value.areaName?.trim() || !advertisementPayload.value.district?.trim()) {
        validationError.value = true;
        errorMessage.value = 'Please complete all required fields: Property Number, Area Name, and City/District.';
        return;
    }
    if (!isPincodeValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid 6-digit numeric postal Pincode.';
        return;
    }
    if (!isLocationPinned.value) {
        validationError.value = true;
        errorMessage.value = 'Please verify your geographic coordinates via the map link.';
        return;
    }

    syncInputsToSessionCache();
    const ultimatePayload = JSON.parse(sessionStorage.getItem(SessionKey.ADVERTISEMENT) || '{}');
    emit('location-completed', ultimatePayload as Advertisement);
};
</script>
<template>
    <div class="vertical-stack-form">
        <!-- PROPERTY NUMBER -->
        <div class="flat-form-field"
            :class="{ 'flat-validation-alert': validationError && !advertisementPayload.propertyNumber?.trim() }">
            <input type="text" class="flat-raw-input" placeholder="Property / Holding Number (e.g. Premise 42-A)"
                v-model="advertisementPayload.propertyNumber" @input="syncInputsToSessionCache" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- AREA NAME -->
        <div class="flat-form-field"
            :class="{ 'flat-validation-alert': validationError && !advertisementPayload.areaName?.trim() }">
            <input type="text" class="flat-raw-input" placeholder="Area Name / Locality (e.g. Sector V)"
                v-model="advertisementPayload.areaName" @input="syncInputsToSessionCache" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ADDRESS PANEL LINES -->
        <div class="flat-form-field"><input type="text" class="flat-raw-input" placeholder="Address Line 1 (Optional)"
                v-model="advertisementPayload.addressLine1" @input="syncInputsToSessionCache" /></div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field"><input type="text" class="flat-raw-input" placeholder="Address Line 2 (Optional)"
                v-model="advertisementPayload.addressLine2" @input="syncInputsToSessionCache" /></div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- CITY / DISTRICT -->
        <div class="flat-form-field"
            :class="{ 'flat-validation-alert': validationError && !advertisementPayload.district?.trim() }">
            <input type="text" class="flat-raw-input" placeholder="City / District"
                v-model="advertisementPayload.district" @input="syncInputsToSessionCache" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- PINCODE -->
        <div class="flat-form-field" :class="{ 'flat-validation-alert': validationError && !isPincodeValid() }">
            <input type="text" class="flat-raw-input" placeholder="6-Digit Postal Pincode"
                v-model="advertisementPayload.pincode" maxlength="6"
                @input="advertisementPayload.pincode = (advertisementPayload.pincode || '').replace(/\D/g, ''); syncInputsToSessionCache();" />
        </div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- POPUP MAP LINK TRIGGER ACTION -->
        <div style="padding: 4px 0 12px 0; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
            <a href="#" @click.prevent="triggerOpenMapModal" class="map-popup-trigger-link">📍 Pin the location on
                map</a>
            <span v-if="isLocationPinned" class="coordinates-saved-badge">✓ Pin Confirmed (Lat: {{
                advertisementPayload.latitude }}, Lng: {{ advertisementPayload.longitude }})</span>
        </div>

        <!-- REUSABLE COMPONENT BOUNDARY -->
        <UniversalMapModal :isOpen="isMapModalOpen" :latitude="advertisementPayload.latitude || 22.5726"
            :longitude="advertisementPayload.longitude || 88.3639" @close="isMapModalOpen = false"
            @confirm="handleMapLocationConfirmed" />

        <!-- CORE ERROR ALERTS MODIFIER -->
        <div v-if="validationError" class="filter-vertical-row"><span class="flat-error-descriptor-text">{{ errorMessage
                }}</span></div>
        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- MAIN SAVE ACTION TRIGGER BUTTON -->
        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveLocation" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                <span class="btn-text-label">Save Location Details</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
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

.flat-validation-alert {
    border-color: #ea580c !important;
    background-color: rgba(234, 88, 12, 0.02) !important;
}
</style>
