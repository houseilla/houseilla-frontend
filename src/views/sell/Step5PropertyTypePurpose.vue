<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { advertisementService } from '../../services/advertisementService';
import { SessionKey } from '../../models/sellWizardEnums';
import { AdvertisementPurpose, AdvertisementCategory } from '../../models/advertisementEnums';
import {
    PURPOSE_OPTIONS,
    CATEGORY_OPTIONS,
    PRIVATE_SUBTYPE_OPTIONS,
    COMMERCIAL_SUBTYPE_OPTIONS,
    PRICING_UNIT_OPTIONS
} from '../../models/sellWizardEnums';

import type { Advertisement } from '@/models/advertisement';

// Core interface props receiving data directly from the parent session shell
const props = defineProps<{
    advertisementData: any | null;
}>();

const emit = defineEmits<{
    (e: 'type-purpose-completed', updatedPayload: any): void;
}>();

// Local working model states initialized with blank/null baselines
const localPurpose = ref<number | null>(null);
const localCategory = ref<number | null>(null);
const localPropertyType = ref<number | null>(null);
const localDescription = ref<string>('');

const localPriceValue = ref<number | null>(null);
const localPriceUnit = ref<number>(100000); // Default standard metric matches Lakh

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');

// Hydrate state parameters from parent props to avoid state drop on backward navigation
onMounted(() => {
    if (props.advertisementData) {
        const d = props.advertisementData;
        if (d.purpose !== undefined) localPurpose.value = d.purpose;
        if (d.category !== undefined) localCategory.value = d.category;
        if (d.propertyType !== undefined) localPropertyType.value = d.propertyType;
        if (d.description !== undefined) localDescription.value = d.description;

        // Pricing parsing layer logic reverse-calculating backend base values cleanly
        if (d.price && d.price > 0) {
            const rawPrice = d.price;
            if (rawPrice >= 10000000) {
                localPriceUnit.value = 10000000;
                localPriceValue.value = Number((rawPrice / 10000000).toFixed(2).replace(/\.00$/, ''));
            } else if (rawPrice >= 100000) {
                localPriceUnit.value = 100000;
                localPriceValue.value = Number((rawPrice / 100000).toFixed(2).replace(/\.00$/, ''));
            } else {
                localPriceUnit.value = 1000;
                localPriceValue.value = Number((rawPrice / 1000).toFixed(2).replace(/\.00$/, ''));
            }
        }
    }
});

// Dynamically switches sub-category list arrays based on Residential vs Commercial choice
const activeSubtypeOptions = computed(() => {
    if (localCategory.value === AdvertisementCategory.PRIVATE) return PRIVATE_SUBTYPE_OPTIONS;
    if (localCategory.value === AdvertisementCategory.COMMERCIAL) return COMMERCIAL_SUBTYPE_OPTIONS;
    return [];
});

// Reactively calculates input float * unit multiplier
const computedFinalPrice = computed(() => {
    if (!localPriceValue.value || localPriceValue.value <= 0) return 0;
    return Math.round(localPriceValue.value * localPriceUnit.value);
});

// Real-time formatted readout string matching standard Indian numbering conventions
const formattedIndianCurrencyReadout = computed(() => {
    const total = computedFinalPrice.value;
    if (total <= 0) return '';
    return `₹ ${total.toLocaleString('en-IN')}`;
});

const pricePlaceholderText = computed(() => {
    if (localPurpose.value === AdvertisementPurpose.RENT) return 'Rent amount...';
    if (localPurpose.value === AdvertisementPurpose.LEASE) return 'Lease amount...';
    return 'Property value...';
});

const handleCategoryResetChange = () => {
    localPropertyType.value = null;
};

// --- Re-engineered Execution & Validation Workflow Engine ---
const processListingCoreAndPricing = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (localPurpose.value === null || localCategory.value === null || localPropertyType.value === null) {
        validationError.value = true;
        errorMessage.value = 'Please select a transaction purpose, category, and property type details.';
        return;
    }
    if (!localPriceValue.value || localPriceValue.value <= 0) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid price baseline amount.';
        return;
    }
    if (!localDescription.value.trim() || localDescription.value.trim().length < 15) {
        validationError.value = true;
        errorMessage.value = 'Please enter a property description (minimum 15 characters).';
        return;
    }

    // 1. Recover advertiser information and Step 4 coordinates safely out of cache matrix
    const savedAdvertiser = JSON.parse(sessionStorage.getItem(SessionKey.ADVERTISER) || '{}');
    const cachedLocation = JSON.parse(sessionStorage.getItem(SessionKey.ADVERTISEMENT) || '{}');

    const targetAdvertiserId = savedAdvertiser.id || 1;
    const targetAdId = cachedLocation.id || null;

    // 2. Build flat data payload matching your backend Hibernate schema column definitions
    const flatPayload: Advertisement = {
        id: targetAdId || 0,
        advertiserId: targetAdvertiserId,
        propertyType: localPropertyType.value,
        purpose: localPurpose.value,
        listingStatus: 0, // Forces initial database DRAFT status tracking mode
        price: computedFinalPrice.value,
        description: localDescription.value.trim(),

        // Populate address fields retrieved cleanly from step 4 session logs
        propertyNumber: cachedLocation.propertyNumber || '',
        areaName: cachedLocation.areaName || '',
        addressLine1: cachedLocation.addressLine1 || '',
        addressLine2: cachedLocation.addressLine2 || '',
        district: cachedLocation.district || '',
        pincode: cachedLocation.pincode || '',
        latitude: cachedLocation.latitude || 22.5726,
        longitude: cachedLocation.longitude || 88.4339,
        isPremium: cachedLocation.isPremium || 0
    };

    console.log('[Step 5] Outbound Flat Payload Layout:', flatPayload);

    try {
        // 3. Dispatch data across your clean Axios service channel method
        const result = await advertisementService.saveAdvertisementListing(targetAdId, flatPayload);

        if (result && result.id) {
            // Append generated persistent database id key safely back to local state and cache
            flatPayload.id = result.id;
            sessionStorage.setItem(SessionKey.ADVERTISEMENT, JSON.stringify(flatPayload));
            emit('type-purpose-completed', flatPayload);
        } else {
            validationError.value = true;
            errorMessage.value = 'Database transaction validation faulted.';
        }
    } catch (error: any) {
        validationError.value = true;
        errorMessage.value = error.response?.data?.message || 'Failed communicating with backend data transaction services.';
        console.error('API backend transmission breakdown response:', error);
    }
};
</script>


<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone animate-fade-in">

        <!-- ROW 1: PURPOSE SELECTOR CHIPS -->
        <div class="borderless-flat-radio-row mobile-wrapping-radio-row"
            :class="{ 'is-invalid-field': validationError && localPurpose === null }">
            <label v-for="opt in PURPOSE_OPTIONS" :key="opt.value" class="flat-radio-label-node"
                :class="{ 'is-active-node': localPurpose === opt.value }">
                <input type="radio" name="wizardPurposeGroup" :value="opt.value" v-model="localPurpose"
                    class="hidden-radio-input" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">{{ opt.label }}</span>
            </label>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 2: CATEGORY MATRIX SELECTOR -->
        <div class="borderless-flat-radio-row mobile-wrapping-radio-row"
            :class="{ 'is-invalid-field': validationError && localCategory === null }">
            <label v-for="cat in CATEGORY_OPTIONS" :key="cat.value" class="flat-radio-label-node"
                :class="{ 'is-active-node': localCategory === cat.value }">
                <input type="radio" name="wizardCategoryGroup" :value="cat.value" v-model="localCategory"
                    @change="handleCategoryResetChange" class="hidden-radio-input" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">{{ cat.label }}</span>
            </label>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 3: DYNAMIC SUBCATEGORY SELECTORS -->
        <div class="filter-vertical-row remove-bottom-gap">
            <span v-if="localCategory === null" class="category-selection-required-prompt">
                Please select a category above to view available property types.
            </span>

            <div v-else class="borderless-flat-radio-row mobile-wrapping-radio-row animate-fade-in"
                :class="{ 'is-invalid-field': validationError && localPropertyType === null }">
                <label v-for="sub in activeSubtypeOptions" :key="sub.value" class="flat-radio-label-node"
                    :class="{ 'is-active-node': localPropertyType === sub.value }">
                    <input type="radio" name="wizardSubtypeGroup" :value="sub.value" v-model="localPropertyType"
                        class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">{{ sub.label }}</span>
                </label>
            </div>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 4: SPLIT PRICING BLOCK INPUTS AND DROPDOWNS -->
        <div class="vertical-input-group">
            <div class="split-pricing-flex-wrapper">

                <!-- Financial Input Box -->
                <div class="flat-form-field price-input-flex-cell"
                    :class="{ 'is-invalid-field': validationError && (!localPriceValue || localPriceValue <= 0) }">
                    <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <input type="number" class="flat-raw-input" :placeholder="pricePlaceholderText"
                        v-model.number="localPriceValue" min="0.01" step="any" />
                </div>

                <!-- Unit Designation Selector Dropdown -->
                <div class="flat-form-field unit-dropdown-flex-cell">
                    <div class="dropdown-labeled-floating-wrapper">
                        <span class="dropdown-floating-header-label">Unit</span>
                        <select class="flat-raw-select reset-select-paddings" v-model="localPriceUnit">
                            <option v-for="unit in PRICING_UNIT_OPTIONS" :key="unit.multiplier"
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

            <!-- Total Indian Local Currency Readout Confirmation String -->
            <span v-if="formattedIndianCurrencyReadout" class="live-currency-readout animate-fade-in">
                Calculated Total: <strong>{{ formattedIndianCurrencyReadout }}</strong>
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- ROW 5: EXTENDED DESCRIPTION TEXTAREA CONSTRAINTS PANEL -->
        <div class="vertical-input-group">
            <div class="flat-textarea-container"
                :class="{ 'is-invalid-textarea': validationError && localDescription.trim().length < 15 }">
                <textarea class="flat-raw-textarea"
                    placeholder="Describe your property listings context (e.g. landmarks, water access, security or repairs status)..."
                    v-model="localDescription" maxlength="1000"></textarea>
                <span class="textarea-character-counter">
                    {{ localDescription.length }} / 1000
                </span>
            </div>
        </div>

        <!-- UNIFIED DESIGN SYSTEM ERROR DISPLAY DRAWER -->
        <div v-if="validationError" class="filter-vertical-row remove-bottom-gap">
            <span class="flat-error-descriptor-text shake-error-cue">
                {{ errorMessage }}
            </span>
        </div>

        <div class="divider-line-container"><span class="horizontal-hairline-divider"></span></div>

        <!-- MASTER FOOTER PROGRESS TRIGGER BUTTON -->
        <div class="flat-btn-row-wrapper">
            <button @click="processListingCoreAndPricing" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <span class="btn-label-text">Confirm & Proceed to Specifications</span>
            </button>
        </div>

    </div>
</template>

<style scoped>
.hidden-radio-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.mobile-wrapping-radio-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 24px;
    width: 100%;
}

@media (max-width: 768px) {
    .mobile-wrapping-radio-row {
        flex-wrap: wrap;
        gap: 12px 20px;
    }
}

.vertical-input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.split-pricing-flex-wrapper {
    display: flex;
    gap: 16px;
    width: 100%;
    align-items: center;
}

.price-input-flex-cell {
    flex: 7;
}

.unit-dropdown-flex-cell {
    flex: 3;
    padding-right: 12px !important;
    cursor: pointer;
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
    padding-left: 12px;
}

.reset-select-paddings {
    padding-left: 12px !important;
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

.live-currency-readout {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent-color);
    padding-left: 4px;
}

.shake-error-cue {
    animation: componentLayoutShake 0.4s ease-in-out;
}

@keyframes componentLayoutShake {

    0%,
    100% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(-4px);
    }

    75% {
        transform: translateX(4px);
    }
}
</style>
