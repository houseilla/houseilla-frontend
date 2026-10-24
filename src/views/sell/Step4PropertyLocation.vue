<script setup lang="ts">
import { ref, onMounted } from 'vue';

const emit = defineEmits<{
    (e: 'sync-step-number', step: number): void;
    (e: 'location-completed'): void;
}>();

// Form tracking keys matching lines 100-110 in your Advertisement model
const locationForm = ref({
    propertyNumber: '',
    areaName: '',
    addressLine1: '',
    addressLine2: '',
    district: '',
    pincode: '',
    latitude: 22.5726,  // Default baseline center coordinate for Kolkata
    longitude: 88.3639
});

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');

onMounted(() => {
    emit('sync-step-number', 4);

    // Restore text parameters if the user bounces backward across wizard screens
    const cachedInputs = sessionStorage.getItem('houseilla_step4_inputs');
    if (cachedInputs) {
        locationForm.value = JSON.parse(cachedInputs);
    }
});

// Real-time listener caching check to preserve input data upon F5 window refreshes
const cacheLocationInputs = () => {
    sessionStorage.setItem('houseilla_step4_inputs', JSON.stringify(locationForm.value));
};

const isPincodeValid = () => /^\d{6}$/.test(locationForm.value.pincode.trim());

const handleSaveLocation = () => {
    validationError.value = false;
    errorMessage.value = '';

    // VALIDATION: Property Number, Area Name, and City/District are mandatory
    if (!locationForm.value.propertyNumber.trim() ||
        !locationForm.value.areaName.trim() ||
        !locationForm.value.district.trim()) {
        validationError.value = true;
        errorMessage.value = 'Please complete all required fields: Property Number, Area Name, and City/District.';
        return;
    }

    // VALIDATION: Explicit 6-digit postal constraint check
    if (!isPincodeValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid 6-digit numeric postal Pincode.';
        return;
    }

    // Cache the verified payload values and advance wizard pipeline forward
    sessionStorage.setItem('houseilla_step4_final_payload', JSON.stringify(locationForm.value));
    emit('location-completed');
};
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone animate-fade-in">

        <!-- 1. TEXT BOXES INPUT STREAM -->
        <div class="flat-form-field"
            :class="{ 'flat-validation-alert': validationError && !locationForm.propertyNumber.trim() }">
            <input type="text" class="flat-raw-input" placeholder="Property / Holding Number (e.g. Premise 42-A)"
                v-model="locationForm.propertyNumber" @input="cacheLocationInputs" />
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field"
            :class="{ 'flat-validation-alert': validationError && !locationForm.areaName.trim() }">
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

        <div class="flat-form-field"
            :class="{ 'flat-validation-alert': validationError && !locationForm.district.trim() }">
            <input type="text" class="flat-raw-input" placeholder="City / District" v-model="locationForm.district"
                @input="cacheLocationInputs" />
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <div class="flat-form-field" :class="{ 'flat-validation-alert': validationError && !isPincodeValid() }">
            <input type="text" class="flat-raw-input" placeholder="6-Digit Postal Pincode"
                v-model="locationForm.pincode" maxlength="6"
                @input="locationForm.pincode = locationForm.pincode.replace(/\D/g, ''); cacheLocationInputs();" />
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 2. MAP DISPLAY VIEWPORT CONTAINER PLACEHOLDER -->
        <div class="map-render-wrapper-box">
            <div class="map-placeholder-graphic-center">
                <div class="map-graphic-icon">🗺️</div>
                <h4 class="map-placeholder-heading">Google Maps Canvas Slot</h4>
                <p class="map-placeholder-caption">Free map pinning and geolocation pin tracking structures will embed
                    inside this container block later.</p>
            </div>
        </div>

        <!-- 3. BALANCED VALIDATION ERROR FIELD (Identical to Step 2 Profile style) -->
        <div v-if="validationError" class="filter-vertical-row" style="margin-top: 12px; margin-bottom: -4px;">
            <span class="flat-error-descriptor-text">
                {{ errorMessage }}
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- 4. SAVE LOCATION ACTION EXECUTOR BUTTON (Identical to Profile style button) -->
        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveLocation" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                </svg>
                <span class="btn-text-label">Save Location Details</span>
            </button>
        </div>

    </div>
</template>

<style scoped>
/* Map Display Frame Blueprint Wrapper */
.map-render-wrapper-box {
    width: 100%;
    height: 280px;
    border-radius: 12px;
    background-color: var(--bg-color);
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    box-shadow: var(--neomorphic-flat, 0 2px 6px rgba(0, 0, 0, 0.02));
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

[data-theme="dark"] .map-render-wrapper-box {
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: none;
}

.map-placeholder-graphic-center {
    text-align: center;
    max-width: 440px;
}

.map-graphic-icon {
    font-size: 32px;
    margin-bottom: 8px;
}

.map-placeholder-heading {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 4px 0;
}

.map-placeholder-caption {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-color);
    opacity: 0.5;
    line-height: 1.5;
    margin: 0;
}
</style>
