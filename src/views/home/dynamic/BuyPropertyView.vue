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

interface PurposeBudgetConfig {
    purpose: number;
    title: string;
    min: number;
    max: number;
    step: number;
    isMonthly: boolean;
}

const PURPOSE_BUDGET_CONFIGS: Record<number, PurposeBudgetConfig> = {
    [AdvertisementPurpose.SALE]: {
        purpose: AdvertisementPurpose.SALE,
        title: 'Sale Budget Range',
        min: 500000,      // ₹5 Lakh
        max: 50000000,    // ₹5 Cr
        step: 500000,     // ₹5 Lakh
        isMonthly: false
    },
    [AdvertisementPurpose.RENT]: {
        purpose: AdvertisementPurpose.RENT,
        title: 'Monthly Rent Budget Range',
        min: 5000,        // ₹5,000 / mo
        max: 150000,      // ₹1.5 Lakh / mo
        step: 2500,       // ₹2,500
        isMonthly: true
    },
    [AdvertisementPurpose.LEASE]: {
        purpose: AdvertisementPurpose.LEASE,
        title: 'Lease Budget Range',
        min: 25000,       // ₹25,000 / mo
        max: 1000000,     // ₹10 Lakh / mo
        step: 25000,      // ₹25,000
        isMonthly: true
    }
};

const searchQuery = ref({
    category: null as number | null,
    purposes: [] as number[],
    propertyTypes: [] as number[],
    budgets: {
        [AdvertisementPurpose.SALE]: { min: 500000, max: 50000000 },
        [AdvertisementPurpose.RENT]: { min: 5000, max: 150000 },
        [AdvertisementPurpose.LEASE]: { min: 25000, max: 1000000 }
    } as Record<number, { min: number; max: number }>,
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

const activeBudgetConfigs = computed<PurposeBudgetConfig[]>(() => {
    const sorted = [...searchQuery.value.purposes].sort((a, b) => a - b);
    return sorted
        .map((p) => PURPOSE_BUDGET_CONFIGS[p])
        .filter((cfg): cfg is PurposeBudgetConfig => Boolean(cfg));
});

const getBudgetRange = (cfg: PurposeBudgetConfig): { min: number; max: number } => {
    if (!searchQuery.value.budgets[cfg.purpose]) {
        searchQuery.value.budgets[cfg.purpose] = { min: cfg.min, max: cfg.max };
    }
    return searchQuery.value.budgets[cfg.purpose]!;
};
const resetAllBudgets = () => {
    Object.values(PURPOSE_BUDGET_CONFIGS).forEach((cfg) => {
        searchQuery.value.budgets[cfg.purpose] = { min: cfg.min, max: cfg.max };
    });
};

const formatPurposePrice = (val: number, isMonthly: boolean): string => {
    if (!isMonthly) {
        if (val >= 10000000) {
            return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} Cr`;
        }
        return `₹${Math.round(val / 100000)} L`;
    }
    if (val >= 100000) {
        return `₹${(val / 100000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')} L/mo`;
    }
    return `₹${val.toLocaleString('en-IN')}/mo`;
};

const getRangeLabel = (cfg: PurposeBudgetConfig): string => {
    const current = searchQuery.value.budgets[cfg.purpose];
    if (!current) return 'Any Budget';
    const isMinAtStart = current.min <= cfg.min;
    const isMaxAtEnd = current.max >= cfg.max;
    if (isMinAtStart && isMaxAtEnd) return 'Any Budget';

    const minText = formatPurposePrice(current.min, cfg.isMonthly);
    const maxText = isMaxAtEnd
        ? `${formatPurposePrice(cfg.max, cfg.isMonthly)}+`
        : formatPurposePrice(current.max, cfg.isMonthly);
    return `${minText} – ${maxText}`;
};

const getMinPercent = (cfg: PurposeBudgetConfig): number => {
    const current = searchQuery.value.budgets[cfg.purpose];
    if (!current) return 0;
    return ((current.min - cfg.min) / (cfg.max - cfg.min)) * 100;
};

const getMaxPercent = (cfg: PurposeBudgetConfig): number => {
    const current = searchQuery.value.budgets[cfg.purpose];
    if (!current) return 100;
    return ((current.max - cfg.min) / (cfg.max - cfg.min)) * 100;
};

const handleMinSliderInput = (cfg: PurposeBudgetConfig) => {
    const current = searchQuery.value.budgets[cfg.purpose];
    if (!current) return;
    if (current.min > current.max - cfg.step) {
        current.min = current.max - cfg.step;
    }
};

const handleMaxSliderInput = (cfg: PurposeBudgetConfig) => {
    const current = searchQuery.value.budgets[cfg.purpose];
    if (!current) return;
    if (current.max < current.min + cfg.step) {
        current.max = current.min + cfg.step;
    }
};

const handleCategoryChange = () => {
    searchQuery.value.propertyTypes = [];
    resetAllBudgets();
    validationError.value = false;
    triggerShake.value = false;
};

const handlePurposeChange = () => {
    validationError.value = false;
    triggerShake.value = false;
};

const handleTypeChange = () => {
    if (searchQuery.value.propertyTypes.length === 0) {
        resetAllBudgets();
    } else {
        validationError.value = false;
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
            `https://api.postalpincode.in/postoffice/${encodeURIComponent(areaQuery)}`,
            { timeout: 2000 }
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

    // 2. Enforce At Least One Transaction Purpose Checkbox
    if (searchQuery.value.purposes.length === 0) {
        triggerErrorFeedback('Please select at least one transaction purpose (For Sale, For Rent, or For Lease).');
        return;
    }

    // 3. Enforce Mandatory Sub-Type Selection
    if (searchQuery.value.propertyTypes.length === 0) {
        triggerErrorFeedback('Please select at least one property type to filter your search.');
        return;
    }

    // 4. Build Clean URL Query Parameters for /listings
    const sortedPurposes = [...searchQuery.value.purposes].sort((a, b) => a - b);
    const query: Record<string, string> = {
        category: String(searchQuery.value.category),
        purposes: sortedPurposes.join(','),
        types: searchQuery.value.propertyTypes.join(',')
    };

    if (sortedPurposes.length === 1) {
        const p = sortedPurposes.at(0);
        if (p !== undefined) {
            query.purpose = String(p);
            const cfg = PURPOSE_BUDGET_CONFIGS[p];
            const range = searchQuery.value.budgets[p];
            if (cfg && range) {
                if (range.min > cfg.min) query.minBudget = String(range.min);
                if (range.max < cfg.max) query.maxBudget = String(range.max);
            }
        }
    } else {
        sortedPurposes.forEach((p) => {
            const cfg = PURPOSE_BUDGET_CONFIGS[p];
            const range = searchQuery.value.budgets[p];
            if (!cfg || !range) return;
            const keyPrefix =
                p === AdvertisementPurpose.SALE
                    ? 'sale'
                    : p === AdvertisementPurpose.RENT
                        ? 'rent'
                        : 'lease';
            if (range.min > cfg.min) query[`${keyPrefix}Min`] = String(range.min);
            if (range.max < cfg.max) query[`${keyPrefix}Max`] = String(range.max);
        });
    }

    const trimmedLocation = searchQuery.value.locationText.trim();
    if (trimmedLocation) {
        if (/^\d{6}$/.test(trimmedLocation)) {
            query.pincode = trimmedLocation;
        } else {
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

        <!-- ROW 1: Property Category Selection (Private / Commercial) -->
        <div :class="{ 'shake-error-cue': triggerShake && searchQuery.category === null }">
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

        <!-- ROW 2: Transaction Purpose Checkboxes (For Sale / For Rent / For Lease) -->
        <div :class="{ 'shake-error-cue': triggerShake && searchQuery.purposes.length === 0 }">
            <span class="flat-section-caption-label">Transaction Purpose</span>
            <div class="borderless-flat-radio-row mobile-wrapping-radio-row"
                :class="{ 'is-invalid-field': validationError && searchQuery.purposes.length === 0 }">
                <label v-for="opt in PURPOSE_OPTIONS" :key="opt.value" class="flat-radio-label-node"
                    :class="{ 'is-active-node': searchQuery.purposes.includes(opt.value) }">
                    <input type="checkbox" :value="opt.value" v-model="searchQuery.purposes"
                        @change="handlePurposeChange" class="hidden-radio-input" />
                    <span class="custom-checkbox-square"></span>
                    <span class="label-caption-string">{{ opt.label }}</span>
                </label>
            </div>
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- ROW 3: Dynamic Property Type Checkboxes -->
        <div
            :class="{ 'shake-error-cue': triggerShake && searchQuery.category !== null && searchQuery.propertyTypes.length === 0 }">
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

        <!-- ROW 4: Purpose-Specific Dual-Handle Budget Sliders -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <div v-if="activeBudgetConfigs.length === 0">
                <span class="flat-section-caption-label">Budget Range</span>
                <div class="filter-vertical-row remove-bottom-gap">
                    <span class="category-selection-required-prompt">
                        Please select a transaction purpose above to configure budget range.
                    </span>
                </div>
            </div>

            <div v-else
                :class="{ 'budget-disabled-state': searchQuery.propertyTypes.length === 0 || searchQuery.category === null }"
                style="display: flex; flex-direction: column; gap: 16px;">
                <div v-for="cfg in activeBudgetConfigs" :key="cfg.purpose" class="animate-fade-in">
                    <div
                        style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                        <span class="flat-section-caption-label" style="margin-bottom: 0;">
                            {{ cfg.title }}
                        </span>
                        <span class="live-conversion-readout" style="font-weight: 800;">
                            {{ getRangeLabel(cfg) }}
                        </span>
                    </div>

                    <div class="dual-range-slider-wrapper">
                        <div class="dual-range-track-bg"></div>
                        <div class="dual-range-track-fill" :style="{
                            left: `${getMinPercent(cfg)}%`,
                            width: `${Math.max(0, getMaxPercent(cfg) - getMinPercent(cfg))}%`
                        }"></div>

                        <input type="range" class="dual-range-input" :min="cfg.min" :max="cfg.max" :step="cfg.step"
                            :style="{ zIndex: getMinPercent(cfg) > 85 ? 4 : 2 }"
                            :disabled="searchQuery.propertyTypes.length === 0 || searchQuery.category === null"
                            v-model.number="getBudgetRange(cfg).min" @input="handleMinSliderInput(cfg)" />
                        <input type="range" class="dual-range-input" :min="cfg.min" :max="cfg.max" :step="cfg.step"
                            :style="{ zIndex: 3 }"
                            :disabled="searchQuery.propertyTypes.length === 0 || searchQuery.category === null"
                            v-model.number="getBudgetRange(cfg).max" @input="handleMaxSliderInput(cfg)" />
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-top: 6px;">
                        <span class="tile-sub-caption">{{ formatPurposePrice(cfg.min, cfg.isMonthly) }}</span>
                        <span class="tile-sub-caption">{{ formatPurposePrice(cfg.max, cfg.isMonthly) }}+</span>
                    </div>
                </div>
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

.dual-range-slider-wrapper {
    position: relative;
    width: 100%;
    height: 24px;
    display: flex;
    align-items: center;
}

.dual-range-track-bg {
    position: absolute;
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background-color: rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] .dual-range-track-bg {
    background-color: rgba(255, 255, 255, 0.12);
}

.dual-range-track-fill {
    position: absolute;
    height: 6px;
    border-radius: 999px;
    background-color: var(--accent-color);
    pointer-events: none;
}

.dual-range-input {
    position: absolute;
    width: 100%;
    height: 6px;
    background: transparent;
    pointer-events: none;
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
}

.dual-range-input::-webkit-slider-thumb {
    pointer-events: auto;
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--accent-color);
    border: 2.5px solid var(--bg-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    cursor: grab;
    transition: transform 0.15s ease;
}

.dual-range-input::-webkit-slider-thumb:hover {
    transform: scale(1.12);
}

.dual-range-input::-webkit-slider-thumb:active {
    cursor: grabbing;
}

.dual-range-input::-moz-range-thumb {
    pointer-events: auto;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--accent-color);
    border: 2.5px solid var(--bg-color);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    cursor: grab;
}
</style>