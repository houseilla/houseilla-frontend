<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import {
    AdvertisementCategory,
    AdvertisementPurpose
} from '../../../models/advertisementEnums';
import {
    PURPOSE_OPTIONS,
    CATEGORY_OPTIONS,
    PRIVATE_SUBTYPE_OPTIONS,
    COMMERCIAL_SUBTYPE_OPTIONS
} from '../../../models/sellWizardEnums';

const router = useRouter();

const buyLocationInputRef = ref<HTMLInputElement | null>(null);
const validationError = ref(false);
const triggerShake = ref(false);
const errorMessage = ref('');
const isResolvingLocation = ref(false);

const searchQuery = ref({
    purpose: AdvertisementPurpose.SALE as number,
    category: null as number | null,
    propertyTypes: [] as number[],
    budgetTier: '',
    locationText: ''
});

const dynamicPropertyTypes = computed(() => {
    if (searchQuery.value.category === AdvertisementCategory.PRIVATE) {
        return PRIVATE_SUBTYPE_OPTIONS;
    }
    if (searchQuery.value.category === AdvertisementCategory.COMMERCIAL) {
        return COMMERCIAL_SUBTYPE_OPTIONS;
    }
    return [];
});

const budgetTierOptions = computed(() => {
    if (searchQuery.value.purpose === AdvertisementPurpose.SALE) {
        return [
            { value: '1', label: 'Under ₹50 Lakh' },
            { value: '2', label: '₹50 L - ₹1 Cr' },
            { value: '3', label: '₹1 Cr - ₹3 Cr' },
            { value: '4', label: 'Above ₹3 Cr' }
        ];
    }
    return [
        { value: '1', label: 'Under ₹15,000' },
        { value: '2', label: '₹15k - ₹35k' },
        { value: '3', label: '₹35k - ₹75k' },
        { value: '4', label: 'Above ₹75k' }
    ];
});

const handlePurposeChange = () => {
    searchQuery.value.budgetTier = '';
};

const handleCategoryChange = () => {
    searchQuery.value.propertyTypes = [];
    searchQuery.value.budgetTier = '';
    validationError.value = false;
    triggerShake.value = false;
};

const handleTypeChange = () => {
    if (searchQuery.value.propertyTypes.length === 0) {
        searchQuery.value.budgetTier = '';
    }
};

const triggerErrorFeedback = (message: string) => {
    validationError.value = true;
    errorMessage.value = message;
    triggerShake.value = true;
    setTimeout(() => {
        triggerShake.value = false;
    }, 450);
};

// Tier 2 Helper: Optional West Bengal pincode lookup for known post office areas
const resolveWestBengalPincodes = async (areaQuery: string): Promise<string[]> => {
    try {
        const response = await axios.get(
            `https://api.postalpincode.in/postoffice/${encodeURIComponent(areaQuery)}`,{ timeout: 2000 }
        );
        const entry = Array.isArray(response.data) ? response.data[0] : null;

        if (entry?.Status === 'Success' && Array.isArray(entry.PostOffice)) {
            const wbPincodes = entry.PostOffice
                .filter((po: any) => po.State?.toLowerCase() === 'west bengal' && po.Pincode)
                .map((po: any) => String(po.Pincode).trim());
            return Array.from(new Set(wbPincodes));
        }
    } catch {
        // Silently ignore missing post office or timeout; Tier 3 DB text match handles it
    }
    return [];
};

const executePropertySearch = async () => {
    if (isResolvingLocation.value) return;

    validationError.value = false;
    triggerShake.value = false;
    errorMessage.value = '';

    // 1. Enforce Mandatory Category Choice (Private / Commercial)
    if (searchQuery.value.category === null) {
        triggerErrorFeedback('Please select a property category (Private or Commercial) to proceed.');
        return;
    }

    // 2. Enforce Mandatory Sub-Type Selection
    if (searchQuery.value.propertyTypes.length === 0) {
        validationError.value = true;
        errorMessage.value = 'Please select at least one property type to filter your search.';
        return;
    }

    // 3. Build Clean URL Query Parameters for /listings
    const query: Record<string, string> = {
        purpose: String(searchQuery.value.purpose),
        category: String(searchQuery.value.category),
        types: searchQuery.value.propertyTypes.join(',')
    };

    if (searchQuery.value.budgetTier) {
        query.budget = searchQuery.value.budgetTier;
    }

    const trimmedLocation = searchQuery.value.locationText.trim();
    if (trimmedLocation) {
        if (/^\d{6}$/.test(trimmedLocation)) {
            // Tier 1: Direct 6-digit PIN code
            query.pincode = trimmedLocation;
        } else {
            // Tier 2 & 3: Always include text query 'q', plus resolved WB pincodes if found
            query.q = trimmedLocation;
            isResolvingLocation.value = true;
            try {
                const matchedPincodes = await resolveWestBengalPincodes(trimmedLocation);
                if (matchedPincodes.length > 0) {
                    query.pincodes = matchedPincodes.join(',');
                }
            } finally {
                isResolvingLocation.value = false;
            }
        }
    }

    router.push({
        path: '/listings',
        query
    });
};

defineExpose({
    focusInput: () => buyLocationInputRef.value?.focus()
});
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- ROW 1: Transaction Purpose (For Sale / For Rent / For Lease) -->
        <div>
            <span class="flat-section-caption-label">Transaction Purpose</span>
            <div class="borderless-flat-radio-row mobile-wrapping-radio-row">
                <label v-for="opt in PURPOSE_OPTIONS" :key="opt.value" class="flat-radio-label-node"
                    :class="{ 'is-active-node': searchQuery.purpose === opt.value }">
                    <input type="radio" name="buyPurpose" :value="opt.value" v-model="searchQuery.purpose"
                        @change="handlePurposeChange" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">{{ opt.label }}</span>
                </label>
            </div>
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- ROW 2: Category Selection (Private / Commercial) -->
        <div :class="{ 'shake-error-cue': triggerShake }">
            <span class="flat-section-caption-label">Property Category</span>
            <div class="borderless-flat-radio-row mobile-wrapping-radio-row"
                :class="{ 'is-invalid-field': validationError && searchQuery.category === null }">
                <label v-for="cat in CATEGORY_OPTIONS" :key="cat.value" class="flat-radio-label-node"
                    :class="{ 'is-active-node': searchQuery.category === cat.value }">
                    <input type="radio" name="buyCategory" :value="cat.value" v-model="searchQuery.category"
                        @change="handleCategoryChange" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">{{ cat.label }}</span>
                </label>
            </div>
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- ROW 3: Dynamic Property Type Checkboxes -->
        <div>
            <span class="flat-section-caption-label">Property Type</span>
            <div class="filter-vertical-row remove-bottom-gap">
                <span v-if="searchQuery.category === null" class="category-selection-required-prompt">
                    Please select a category above to view available property types.
                </span>

                <div v-else class="borderless-flat-radio-row mobile-wrapping-radio-row animate-fade-in"
                    :class="{ 'is-invalid-field': validationError && searchQuery.propertyTypes.length === 0 }">
                    <label v-for="item in dynamicPropertyTypes" :key="item.value" class="flat-radio-label-node"
                        :class="{ 'is-active-node': searchQuery.propertyTypes.includes(item.value) }">
                        <input type="checkbox" :value="item.value" v-model="searchQuery.propertyTypes"
                            @change="handleTypeChange" class="hidden-radio-input" />
                        <span class="custom-checkbox-square"></span>
                        <span class="label-caption-string">{{ item.label }}</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- ROW 4: Budget Tier Selection (Unlocks once Property Type is selected) -->
        <div
            :class="{ 'budget-disabled-state': searchQuery.propertyTypes.length === 0 || searchQuery.category === null }">
            <span class="flat-section-caption-label">
                {{ searchQuery.purpose === AdvertisementPurpose.SALE ? 'Budget Range' : 'Monthly Budget Range' }}
            </span>
            <div class="borderless-flat-radio-row mobile-wrapping-radio-row">
                <label v-for="tier in budgetTierOptions" :key="tier.value" class="flat-radio-label-node"
                    :class="{ 'is-active-node': searchQuery.budgetTier === tier.value }">
                    <input type="radio" name="buyBudgetTier" :value="tier.value"
                        :disabled="searchQuery.propertyTypes.length === 0" v-model="searchQuery.budgetTier"
                        class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">{{ tier.label }}</span>
                </label>
            </div>
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- ROW 5: Location Entry Search Box -->
        <div class="filter-vertical-row">
            <div class="flat-form-field">
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input ref="buyLocationInputRef" type="text" class="flat-raw-input"
                    placeholder="Search by city, area name, or PIN..." v-model="searchQuery.locationText"
                    @keyup.enter="executePropertySearch" />
            </div>
        </div>

        <!-- Validation Error Alert -->
        <div v-if="validationError" class="filter-vertical-row animate-fade-in"
            style="margin-top: -6px; margin-bottom: -6px;">
            <span class="flat-error-descriptor-text">
                {{ errorMessage }}
            </span>
        </div>

        <div v-else class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Search Submit Button -->
        <div class="filter-vertical-row">
            <div class="flat-btn-row-wrapper">
                <button @click="executePropertySearch" :disabled="isResolvingLocation"
                    class="flat-full-width-action-btn" type="button">
                    <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span class="btn-label-text">
                        {{ isResolvingLocation ? 'Searching Properties...' : 'Search Properties' }}
                    </span>
                </button>
            </div>
        </div>

    </div>
</template>

<style scoped>
.budget-disabled-state {
    opacity: 0.35;
    pointer-events: none;
    filter: grayscale(1);
    transition: opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
</style>

