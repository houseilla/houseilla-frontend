<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { advertisementService } from '../../../../../services/advertisementService';
import {
    SessionKey,
    LAND_AREA_UNIT_OPTIONS,
    BUILDING_AREA_UNIT_OPTIONS,
    ROAD_FACING_OPTIONS
} from '../../../../../models/sellWizardEnums';
import type { Advertisement, HouseDetail } from '../../../../../models/advertisement';

const emit = defineEmits<{
    (e: 'details-completed', payload: HouseDetail): void;
}>();

const advertisementId = ref<number>(0);
const houseDetailId = ref<number>(0);

const localLandAreaValue = ref<number | null>(null);
const localLandAreaUnit = ref<number>(1);
const localCarpetAreaValue = ref<number | null>(null);
const localCarpetAreaUnit = ref<number>(1);
const localFloors = ref<number | null>(1);
const localNoOfParking = ref<number>(0);
const localRoadFacing = ref<string>('East');
const localRoadWidth = ref<number | null>(null);

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');
const isSubmitting = ref<boolean>(false);

const hydrateLandAreaFromSqFt = (totalSqFt: number) => {
    if (!totalSqFt || totalSqFt <= 0) return;

    if (totalSqFt % 43560 === 0) {
        localLandAreaUnit.value = 43560;
        localLandAreaValue.value = totalSqFt / 43560;
    } else if (totalSqFt % 14400 === 0) {
        localLandAreaUnit.value = 14400;
        localLandAreaValue.value = totalSqFt / 14400;
    } else if (totalSqFt % 720 === 0) {
        localLandAreaUnit.value = 720;
        localLandAreaValue.value = totalSqFt / 720;
    } else {
        localLandAreaUnit.value = 1;
        localLandAreaValue.value = totalSqFt;
    }
};

onMounted(() => {
    const cachedAd = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    if (cachedAd) {
        const parsedAd: Advertisement = JSON.parse(cachedAd);
        advertisementId.value = parsedAd.id || 0;
    }

    const cachedDetails = sessionStorage.getItem(SessionKey.PROPERTY_DETAILS);
    if (cachedDetails) {
        const parsedDetails: HouseDetail = JSON.parse(cachedDetails);
        if (parsedDetails.advertisementId === advertisementId.value) {
            houseDetailId.value = parsedDetails.id || 0;
            hydrateLandAreaFromSqFt(parsedDetails.landArea);

            if (parsedDetails.carpetArea && parsedDetails.carpetArea > 0) {
                localCarpetAreaUnit.value = 1;
                localCarpetAreaValue.value = parsedDetails.carpetArea;
            }

            localFloors.value = parsedDetails.floors ?? 1;
            localNoOfParking.value = parsedDetails.noOfParking ?? 0;
            localRoadFacing.value = parsedDetails.roadFacing || 'East';
            localRoadWidth.value = parsedDetails.roadWidth ?? null;
        }
    }
});

const computedLandSqFt = computed<number>(() => {
    if (!localLandAreaValue.value || localLandAreaValue.value <= 0) return 0;
    return Math.round(localLandAreaValue.value * localLandAreaUnit.value);
});

const formattedLandSqFtReadout = computed<string>(() => {
    const total = computedLandSqFt.value;
    if (total <= 0) return '';
    return `${total.toLocaleString('en-IN')} Sq. Ft.`;
});

const computedCarpetSqFt = computed<number>(() => {
    if (!localCarpetAreaValue.value || localCarpetAreaValue.value <= 0) return 0;
    return Math.round(localCarpetAreaValue.value * localCarpetAreaUnit.value);
});

const formattedCarpetSqFtReadout = computed<string>(() => {
    const total = computedCarpetSqFt.value;
    if (total <= 0) return '';
    return `${total.toLocaleString('en-IN')} Sq. Ft.`;
});

const handleSaveHouseDetails = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!advertisementId.value) {
        validationError.value = true;
        errorMessage.value = 'Missing valid Advertisement ID. Please complete Step 5 first.';
        return;
    }

    if (!localLandAreaValue.value || localLandAreaValue.value <= 0 || computedLandSqFt.value <= 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid plot / land area.';
        return;
    }

    if (!localCarpetAreaValue.value || localCarpetAreaValue.value <= 0 || computedCarpetSqFt.value <= 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid carpet area.';
        return;
    }

    if (!localFloors.value || localFloors.value < 1) {
        validationError.value = true;
        errorMessage.value = 'Please enter the total number of floors (minimum 1).';
        return;
    }

    if (localNoOfParking.value < 0) {
        validationError.value = true;
        errorMessage.value = 'Number of 4-wheeler parkings cannot be negative (enter 0 if none).';
        return;
    }

    if (!localRoadFacing.value) {
        validationError.value = true;
        errorMessage.value = 'Please select the road-facing direction.';
        return;
    }

    if (!localRoadWidth.value || localRoadWidth.value <= 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid approach road width in feet.';
        return;
    }

    const payload: HouseDetail = {
        id: houseDetailId.value,
        advertisementId: advertisementId.value,
        landArea: computedLandSqFt.value,
        carpetArea: computedCarpetSqFt.value,
        floors: localFloors.value,
        noOfParking: localNoOfParking.value || 0,
        roadFacing: localRoadFacing.value,
        roadWidth: Math.round(localRoadWidth.value)
    };

    isSubmitting.value = true;
    try {
        const savedRecord = await advertisementService.saveHouseDetail(payload);
        emit('details-completed', savedRecord);
    } catch (error: any) {
        validationError.value = true;
        errorMessage.value = error.response?.data?.message || 'Failed to save house specifications. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="vertical-stack-form animate-fade-in">

        <!-- ROW 1: PLOT / LAND AREA -->
        <div class="vertical-input-group">
            <div class="split-field-flex-wrapper">
                <div class="flat-form-field split-primary-flex-cell"
                    :class="{ 'is-invalid-field': validationError && (!localLandAreaValue || localLandAreaValue <= 0) }">
                    <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    <div class="flat-field-labeled-stack">
                        <span class="flat-field-top-label">Total Plot / Land Area</span>
                        <input type="number" class="flat-raw-input" placeholder="e.g. 4"
                            v-model.number="localLandAreaValue" min="0.01" step="any" />
                    </div>
                </div>

                <div class="flat-form-field split-unit-flex-cell">
                    <div class="flat-field-labeled-stack no-icon">
                        <span class="flat-field-top-label">Unit</span>
                        <select class="flat-raw-select" v-model="localLandAreaUnit">
                            <option v-for="unit in LAND_AREA_UNIT_OPTIONS" :key="unit.multiplier"
                                :value="unit.multiplier">
                                {{ unit.label }}
                            </option>
                        </select>
                    </div>
                    <svg class="flat-dropdown-indicator-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <span v-if="formattedLandSqFtReadout" class="live-conversion-readout animate-fade-in">
                Standardized Land Area: <strong>{{ formattedLandSqFtReadout }}</strong>
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 2: CARPET AREA -->
        <div class="vertical-input-group">
            <div class="split-field-flex-wrapper">
                <div class="flat-form-field split-primary-flex-cell"
                    :class="{ 'is-invalid-field': validationError && (!localCarpetAreaValue || localCarpetAreaValue <= 0) }">
                    <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <div class="flat-field-labeled-stack">
                        <span class="flat-field-top-label">Carpet Area</span>
                        <input type="number" class="flat-raw-input" placeholder="e.g. 1800"
                            v-model.number="localCarpetAreaValue" min="1" step="any" />
                    </div>
                </div>

                <div class="flat-form-field split-unit-flex-cell">
                    <div class="flat-field-labeled-stack no-icon">
                        <span class="flat-field-top-label">Unit</span>
                        <select class="flat-raw-select" v-model="localCarpetAreaUnit">
                            <option v-for="unit in BUILDING_AREA_UNIT_OPTIONS" :key="unit.multiplier"
                                :value="unit.multiplier">
                                {{ unit.label }}
                            </option>
                        </select>
                    </div>
                    <svg class="flat-dropdown-indicator-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <span v-if="formattedCarpetSqFtReadout" class="live-conversion-readout animate-fade-in">
                Standardized Carpet Area: <strong>{{ formattedCarpetSqFtReadout }}</strong>
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 3: FLOORS & 4-WHEELER PARKINGS -->
        <div class="two-col-field-row">
            <div class="flat-form-field"
                :class="{ 'is-invalid-field': validationError && (!localFloors || localFloors < 1) }">
                <div class="flat-field-labeled-stack no-icon">
                    <span class="flat-field-top-label">Total Floors</span>
                    <input type="number" class="flat-raw-input" placeholder="e.g. 2"
                        v-model.number="localFloors" min="1" />
                </div>
            </div>

            <div class="flat-form-field"
                :class="{ 'is-invalid-field': validationError && localNoOfParking < 0 }">
                <div class="flat-field-labeled-stack no-icon">
                    <span class="flat-field-top-label">4-Wheeler Parkings (0 if none)</span>
                    <input type="number" class="flat-raw-input" placeholder="0"
                        v-model.number="localNoOfParking" min="0" />
                </div>
            </div>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 4: ROAD FACING & APPROACH ROAD WIDTH -->
        <div class="two-col-field-row">
            <div class="flat-form-field split-unit-flex-cell"
                :class="{ 'is-invalid-field': validationError && !localRoadFacing }">
                <div class="flat-field-labeled-stack no-icon">
                    <span class="flat-field-top-label">Road Facing Direction</span>
                    <select class="flat-raw-select" v-model="localRoadFacing">
                        <option v-for="direction in ROAD_FACING_OPTIONS" :key="direction" :value="direction">
                            {{ direction }}
                        </option>
                    </select>
                </div>
                <svg class="flat-dropdown-indicator-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            <div class="flat-form-field"
                :class="{ 'is-invalid-field': validationError && (!localRoadWidth || localRoadWidth <= 0) }">
                <div class="flat-field-labeled-stack no-icon">
                    <span class="flat-field-top-label">Approach Road Width (Feet)</span>
                    <input type="number" class="flat-raw-input" placeholder="e.g. 20"
                        v-model.number="localRoadWidth" min="1" />
                </div>
            </div>
        </div>

        <!-- VALIDATION ERROR -->
        <div v-if="validationError" class="filter-vertical-row remove-bottom-gap">
            <span class="flat-error-descriptor-text shake-error-cue">
                {{ errorMessage }}
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- SUBMIT BUTTON -->
        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveHouseDetails" :disabled="isSubmitting" class="flat-full-width-action-btn"
                type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2h11"></path>
                </svg>
                <span class="btn-label-text">
                    {{ isSubmitting ? 'Saving House Specifications...' : 'Save & Proceed to Media' }}
                </span>
            </button>
        </div>

    </div>
</template>
