<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { advertisementService } from '../../../services/advertisementService';
import {
    SessionKey,
    BUILDING_AREA_UNIT_OPTIONS,
    OFFICE_FURNISHED_OPTIONS
} from '../../../models/sellWizardEnums';
import type { Advertisement, OfficeDetail } from '../../../models/advertisement';

const emit = defineEmits<{
    (e: 'details-completed', payload: OfficeDetail): void;
}>();

const advertisementId = ref<number>(0);
const officeDetailId = ref<number>(0);

const localFloorNo = ref<number | null>(null);
const localAreaValue = ref<number | null>(null);
const localAreaUnit = ref<number>(1);
const localFurnishedType = ref<string>('Semi-Furnished');

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');
const isSubmitting = ref<boolean>(false);

onMounted(() => {
    const cachedAd = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    if (cachedAd) {
        const parsedAd: Advertisement = JSON.parse(cachedAd);
        advertisementId.value = parsedAd.id || 0;
    }

    const cachedDetails = sessionStorage.getItem(SessionKey.PROPERTY_DETAILS);
    if (cachedDetails) {
        const parsedDetails: OfficeDetail = JSON.parse(cachedDetails);
        if (parsedDetails.advertisementId === advertisementId.value) {
            officeDetailId.value = parsedDetails.id || 0;
            localFloorNo.value = parsedDetails.floorNo ?? null;
            localFurnishedType.value = parsedDetails.furnishedType || 'Semi-Furnished';

            if (parsedDetails.area && parsedDetails.area > 0) {
                localAreaUnit.value = 1;
                localAreaValue.value = parsedDetails.area;
            }
        }
    }
});

const computedTotalSqFt = computed<number>(() => {
    if (!localAreaValue.value || localAreaValue.value <= 0) return 0;
    return Math.round(localAreaValue.value * localAreaUnit.value);
});

const formattedSqFtReadout = computed<string>(() => {
    const total = computedTotalSqFt.value;
    if (total <= 0) return '';
    return `${total.toLocaleString('en-IN')} Sq. Ft.`;
});

const handleSaveOfficeDetails = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!advertisementId.value) {
        validationError.value = true;
        errorMessage.value = 'Missing valid Advertisement ID. Please complete Step 5 first.';
        return;
    }

    if (!localAreaValue.value || localAreaValue.value <= 0 || computedTotalSqFt.value <= 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid office area.';
        return;
    }

    if (localFloorNo.value === null || localFloorNo.value < 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid floor number (0 for Ground Floor).';
        return;
    }

    if (!localFurnishedType.value) {
        validationError.value = true;
        errorMessage.value = 'Please select the office furnishing status.';
        return;
    }

    const payload: OfficeDetail = {
        id: officeDetailId.value,
        advertisementId: advertisementId.value,
        floorNo: localFloorNo.value,
        area: computedTotalSqFt.value,
        furnishedType: localFurnishedType.value
    };

    isSubmitting.value = true;
    try {
        const savedRecord = await advertisementService.saveOfficeDetail(payload);
        emit('details-completed', savedRecord);
    } catch (error: any) {
        validationError.value = true;
        errorMessage.value = error.response?.data?.message || 'Failed to save office specifications. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="vertical-stack-form animate-fade-in">

        <!-- ROW 1: OFFICE AREA -->
        <div class="vertical-input-group">
            <div class="split-field-flex-wrapper">
                <div class="flat-form-field split-primary-flex-cell"
                    :class="{ 'is-invalid-field': validationError && (!localAreaValue || localAreaValue <= 0) }">
                    <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    <div class="flat-field-labeled-stack">
                        <span class="flat-field-top-label">Office Carpet / Built-up Area</span>
                        <input type="number" class="flat-raw-input" placeholder="e.g. 1500"
                            v-model.number="localAreaValue" min="1" step="any" />
                    </div>
                </div>

                <div class="flat-form-field split-unit-flex-cell">
                    <div class="flat-field-labeled-stack no-icon">
                        <span class="flat-field-top-label">Unit</span>
                        <select class="flat-raw-select" v-model="localAreaUnit">
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

            <span v-if="formattedSqFtReadout" class="live-conversion-readout animate-fade-in">
                Standardized Office Area: <strong>{{ formattedSqFtReadout }}</strong>
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 2: FLOOR NUMBER -->
        <div class="flat-form-field"
            :class="{ 'is-invalid-field': validationError && (localFloorNo === null || localFloorNo < 0) }">
            <div class="flat-field-labeled-stack no-icon">
                <span class="flat-field-top-label">Floor Number (0 = Ground Floor)</span>
                <input type="number" class="flat-raw-input" placeholder="e.g. 4"
                    v-model.number="localFloorNo" min="0" />
            </div>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 3: FURNISHED TYPE -->
        <div>
            <span class="flat-section-caption-label">Furnishing Status</span>
            <div class="borderless-flat-radio-row mobile-wrapping-radio-row"
                :class="{ 'is-invalid-field': validationError && !localFurnishedType }">
                <label v-for="option in OFFICE_FURNISHED_OPTIONS" :key="option" class="flat-radio-label-node"
                    :class="{ 'is-active-node': localFurnishedType === option }">
                    <input type="radio" name="officeFurnishedGroup" :value="option" v-model="localFurnishedType"
                        class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">{{ option }}</span>
                </label>
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
            <button @click="handleSaveOfficeDetails" :disabled="isSubmitting" class="flat-full-width-action-btn"
                type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2h11"></path>
                </svg>
                <span class="btn-label-text">
                    {{ isSubmitting ? 'Saving Office Specifications...' : 'Save & Proceed to Media' }}
                </span>
            </button>
        </div>

    </div>
</template>

