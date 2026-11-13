<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { advertisementService } from '../../../services/advertisementService';
import {
    SessionKey,
    BUILDING_AREA_UNIT_OPTIONS,
    FLAT_BHK_OPTIONS,
    FLAT_AMENITY_OPTIONS
} from '../../../models/sellWizardEnums';
import type { Advertisement, FlatDetail } from '../../../models/advertisement';

const emit = defineEmits<{
    (e: 'details-completed', payload: FlatDetail): void;
}>();

const advertisementId = ref<number>(0);
const flatDetailId = ref<number>(0);

const localIsCommunity = ref<boolean>(false);
const localFlatType = ref<string>('2 BHK');
const localCarpetAreaValue = ref<number | null>(null);
const localCarpetAreaUnit = ref<number>(1);
const localBuildingRising = ref<string>('');
const localFloorNumber = ref<number | null>(null);
const localLiftAvailable = ref<boolean>(false);
const localParkings = ref<number>(0);
const localPossessionBy = ref<string>('');
const localPropertyAge = ref<number | null>(0);
const selectedAmenities = ref<string[]>([]);

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
        const parsedDetails: FlatDetail = JSON.parse(cachedDetails);
        if (parsedDetails.advertisementId === advertisementId.value) {
            flatDetailId.value = parsedDetails.id || 0;
            localIsCommunity.value = Boolean(parsedDetails.isCommunity);
            localFlatType.value = parsedDetails.flatType || '2 BHK';
            localBuildingRising.value = parsedDetails.buildingRising || '';
            localFloorNumber.value = parsedDetails.floorNumber ?? null;
            localLiftAvailable.value = Boolean(parsedDetails.liftAvailable);
            localParkings.value = parsedDetails.parkings ?? 0;
            localPossessionBy.value = parsedDetails.possessionBy || '';
            localPropertyAge.value = parsedDetails.propertyAge ?? 0;

            if (parsedDetails.carpetArea && parsedDetails.carpetArea > 0) {
                localCarpetAreaUnit.value = 1;
                localCarpetAreaValue.value = parsedDetails.carpetArea;
            }

            if (parsedDetails.amenities) {
                selectedAmenities.value = parsedDetails.amenities
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);
            }
        }
    }
});

const computedTotalSqFt = computed<number>(() => {
    if (!localCarpetAreaValue.value || localCarpetAreaValue.value <= 0) return 0;
    return Math.round(localCarpetAreaValue.value * localCarpetAreaUnit.value);
});

const formattedSqFtReadout = computed<string>(() => {
    const total = computedTotalSqFt.value;
    if (total <= 0) return '';
    return `${total.toLocaleString('en-IN')} Sq. Ft.`;
});

const toggleAmenity = (amenity: string) => {
    const idx = selectedAmenities.value.indexOf(amenity);
    if (idx === -1) {
        selectedAmenities.value.push(amenity);
    } else {
        selectedAmenities.value.splice(idx, 1);
    }
};

const handleSaveFlatDetails = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!advertisementId.value) {
        validationError.value = true;
        errorMessage.value = 'Missing valid Advertisement ID. Please complete Step 5 first.';
        return;
    }

    if (!localFlatType.value) {
        validationError.value = true;
        errorMessage.value = 'Please select the flat BHK configuration.';
        return;
    }

    if (!localCarpetAreaValue.value || localCarpetAreaValue.value <= 0 || computedTotalSqFt.value <= 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid carpet area.';
        return;
    }

    if (!localBuildingRising.value.trim()) {
        validationError.value = true;
        errorMessage.value = 'Please specify the total building floors / rising (e.g. G+4).';
        return;
    }

    if (localFloorNumber.value === null || localFloorNumber.value < 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid floor number (0 for Ground Floor).';
        return;
    }

    if (!localPossessionBy.value) {
        validationError.value = true;
        errorMessage.value = 'Please select the possession date.';
        return;
    }

    const payload: FlatDetail = {
        id: flatDetailId.value,
        advertisementId: advertisementId.value,
        isCommunity: localIsCommunity.value,
        buildingRising: localBuildingRising.value.trim(),
        floorNumber: localFloorNumber.value,
        carpetArea: computedTotalSqFt.value,
        flatType: localFlatType.value,
        liftAvailable: localLiftAvailable.value,
        parkings: localParkings.value || 0,
        possessionBy: localPossessionBy.value,
        propertyAge: localPropertyAge.value ?? 0,
        amenities: selectedAmenities.value.join(', ')
    };

    isSubmitting.value = true;
    try {
        const savedRecord = await advertisementService.saveFlatDetail(payload);
        emit('details-completed', savedRecord);
    } catch (error: any) {
        validationError.value = true;
        errorMessage.value = error.response?.data?.message || 'Failed to save flat specifications. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
};
</script>
<template>
    <div class="vertical-stack-form animate-fade-in">

        <!-- ROW 1: BUILDING TYPE (STANDALONE VS GATED COMMUNITY) -->
        <div class="borderless-flat-radio-row mobile-wrapping-radio-row">
            <label class="flat-radio-label-node" :class="{ 'is-active-node': !localIsCommunity }">
                <input type="radio" name="flatCommunityGroup" :value="false" v-model="localIsCommunity"
                    class="hidden-radio-input" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">Standalone Building</span>
            </label>

            <label class="flat-radio-label-node" :class="{ 'is-active-node': localIsCommunity }">
                <input type="radio" name="flatCommunityGroup" :value="true" v-model="localIsCommunity"
                    class="hidden-radio-input" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">Gated Community / Complex</span>
            </label>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 2: FLAT CONFIGURATION (BHK) -->
        <div class="borderless-flat-radio-row mobile-wrapping-radio-row"
            :class="{ 'is-invalid-field': validationError && !localFlatType }">
            <label v-for="bhk in FLAT_BHK_OPTIONS" :key="bhk" class="flat-radio-label-node"
                :class="{ 'is-active-node': localFlatType === bhk }">
                <input type="radio" name="flatBhkGroup" :value="bhk" v-model="localFlatType"
                    class="hidden-radio-input" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">{{ bhk }}</span>
            </label>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 3: SPLIT CARPET AREA INPUT & UNIT DROPDOWN -->
        <div class="vertical-input-group">
            <div class="split-area-flex-wrapper">
                <div class="flat-form-field area-input-flex-cell"
                    :class="{ 'is-invalid-field': validationError && (!localCarpetAreaValue || localCarpetAreaValue <= 0) }">
                    <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    <input type="number" class="flat-raw-input" placeholder="Carpet Area..."
                        v-model.number="localCarpetAreaValue" min="1" step="any" />
                </div>

                <div class="flat-form-field unit-dropdown-flex-cell">
                    <div class="dropdown-labeled-floating-wrapper">
                        <span class="dropdown-floating-header-label">Unit</span>
                        <select class="flat-raw-select reset-select-paddings" v-model="localCarpetAreaUnit">
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

            <span v-if="formattedSqFtReadout" class="live-area-readout animate-fade-in">
                Standardized Carpet Area: <strong>{{ formattedSqFtReadout }}</strong>
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 4: BUILDING RISING & FLOOR NUMBER -->
        <div class="two-col-field-row">
            <div class="flat-form-field"
                :class="{ 'is-invalid-field': validationError && !localBuildingRising.trim() }">
                <input type="text" class="flat-raw-input no-icon-padding"
                    placeholder="Building Rising (e.g. G+4, G+12)" v-model="localBuildingRising" />
            </div>

            <div class="flat-form-field"
                :class="{ 'is-invalid-field': validationError && (localFloorNumber === null || localFloorNumber < 0) }">
                <input type="number" class="flat-raw-input no-icon-padding"
                    placeholder="Flat Floor No. (0 = Ground)" v-model.number="localFloorNumber" min="0" />
            </div>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 5: LIFT AVAILABLE & NUMBER OF PARKINGS -->
        <div class="two-col-field-row">
            <div class="borderless-flat-radio-row">
                <label class="flat-radio-label-node" :class="{ 'is-active-node': localLiftAvailable }"
                    @click.prevent="localLiftAvailable = !localLiftAvailable">
                    <span class="custom-checkbox-square"></span>
                    <span class="label-caption-string">Lift / Elevator Available</span>
                </label>
            </div>

            <div class="flat-form-field">
                <input type="number" class="flat-raw-input no-icon-padding"
                    placeholder="Reserved Parkings (0, 1, 2...)" v-model.number="localParkings" min="0" />
            </div>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 6: POSSESSION DATE & PROPERTY AGE -->
        <div class="two-col-field-row">
            <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !localPossessionBy }">
                <div class="dropdown-labeled-floating-wrapper">
                    <span class="dropdown-floating-header-label">Possession By</span>
                    <input type="date" class="flat-raw-input reset-select-paddings" v-model="localPossessionBy" />
                </div>
            </div>

            <div class="flat-form-field">
                <div class="dropdown-labeled-floating-wrapper">
                    <span class="dropdown-floating-header-label">Property Age (Years)</span>
                    <input type="number" class="flat-raw-input reset-select-paddings"
                        placeholder="0 for New" v-model.number="localPropertyAge" min="0" />
                </div>
            </div>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 7: AMENITIES MULTI-SELECT CHECKBOX GRID -->
        <div class="vertical-input-group">
            <span class="category-selection-required-prompt" style="padding: 0 0 4px 0;">
                Select Available Amenities (Optional)
            </span>
            <div class="amenities-checkbox-grid">
                <label v-for="amenity in FLAT_AMENITY_OPTIONS" :key="amenity" class="flat-radio-label-node"
                    :class="{ 'is-active-node': selectedAmenities.includes(amenity) }"
                    @click.prevent="toggleAmenity(amenity)">
                    <span class="custom-checkbox-square"></span>
                    <span class="label-caption-string">{{ amenity }}</span>
                </label>
            </div>
        </div>

        <!-- VALIDATION ERROR MESSAGE -->
        <div v-if="validationError" class="filter-vertical-row remove-bottom-gap">
            <span class="flat-error-descriptor-text shake-error-cue">
                {{ errorMessage }}
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- SUBMIT BUTTON -->
        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveFlatDetails" :disabled="isSubmitting" class="flat-full-width-action-btn"
                type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2h11"></path>
                </svg>
                <span class="btn-label-text">
                    {{ isSubmitting ? 'Saving Flat Specifications...' : 'Save & Proceed to Media' }}
                </span>
            </button>
        </div>

    </div>
</template>
<style scoped>
.vertical-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.split-area-flex-wrapper {
    display: flex;
    gap: 16px;
    width: 100%;
    align-items: center;
}

.area-input-flex-cell {
    flex: 7;
}

.unit-dropdown-flex-cell {
    flex: 3;
    padding-right: 12px !important;
    cursor: pointer;
}

.two-col-field-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
    align-items: center;
}

@media (max-width: 640px) {
    .two-col-field-row {
        grid-template-columns: 1fr;
    }
}

.no-icon-padding {
    padding-left: 4px !important;
}

.dropdown-labeled-floating-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding-top: 4px;
}

.dropdown-floating-header-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-color);
    opacity: 0.5;
    margin-bottom: -2px;
    padding-left: 4px;
}

.reset-select-paddings {
    padding-left: 4px !important;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
}

.flat-dropdown-indicator-arrow {
    width: 14px;
    height: 14px;
    color: var(--text-color);
    opacity: 0.4;
    pointer-events: none;
    flex-shrink: 0;
    margin-left: -20px;
    z-index: 10;
}

.live-area-readout {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent-color);
    padding-left: 4px;
}

.amenities-checkbox-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px 16px;
    width: 100%;
    padding-top: 4px;
}

@media (max-width: 768px) {
    .amenities-checkbox-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
