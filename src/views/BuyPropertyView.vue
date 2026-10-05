<script setup lang="ts">
import { ref, computed } from 'vue'
import { AdvertisementPropertyType } from '../models/enums'
import type { Advertisement } from '../models/advertisement'

// 1. IMPORT YOUR NEW MOCKUP DATABASE FILE HERE
import { mockAdvertisements } from '../mocks/advertisements'

const buyLocationInputRef = ref<HTMLInputElement | null>(null)
const validationError = ref(false)
const triggerShake = ref(false)

// DEFINE CUSTOM EVENT EMITTER: Used to send filtered data up to parent HomeView hub layer
const emit = defineEmits(['on-search-success'])

// SEARCH QUERY FORM MODELS
const searchQuery = ref({
    category: '',                 // Position 1: "0" for Private, "1" for Commercial
    propertyType: [] as string[], // Position 2: Checkbox array tracker
    priceScale: '',               // Position 3: Optional parameter
    queryText: ''                 // Position 4: Optional location string parameter
})

/**
 * Position 2: Dynamic Chained Property Type Logic
 */
const dynamicPropertyTypes = computed(() => {
    if (searchQuery.value.category === '0') {
        return [
            { value: String(AdvertisementPropertyType.PRIVATE_LAND), label: 'Private Land' },
            { value: String(AdvertisementPropertyType.FLAT), label: 'Flat' },
            { value: String(AdvertisementPropertyType.HOUSE), label: 'House' }
        ]
    } else if (searchQuery.value.category === '1') {
        return [
            { value: String(AdvertisementPropertyType.OFFICE), label: 'Office' },
            { value: String(AdvertisementPropertyType.SHOP), label: 'Shop' },
            { value: String(AdvertisementPropertyType.COMMERCIAL_LAND), label: 'Commercial Land' },
            { value: String(AdvertisementPropertyType.WAREHOUSE), label: 'Warehouse' }
        ]
    }
    return []
})

const handleCategoryChange = () => {
    searchQuery.value.propertyType = []
    searchQuery.value.priceScale = ''
    validationError.value = false
    triggerShake.value = false
}

const handleTypeChange = () => {
    if (searchQuery.value.propertyType.length === 0) {
        searchQuery.value.priceScale = ''
    }
}

/**
 * ACTION EXECUTION: Filters mock file records and transmits data upward to parent component hub
 */
const executePropertySearch = () => {
    validationError.value = false
    triggerShake.value = false

    // Enforce Category Choice Mandatory Check
    if (!searchQuery.value.category) {
        validationError.value = true
        triggerShake.value = true
        setTimeout(() => { triggerShake.value = false }, 450)
        return
    }

    // Enforce At Least One Checkbox Check Mandatory Check
    if (searchQuery.value.propertyType.length === 0) {
        validationError.value = true
        return
    }

    // Core Filter Loop: Queries your mockAdvertisements array safely
    const filteredResults = mockAdvertisements.filter(ad => {
        const matchesCategory = String(ad.category) === searchQuery.value.category
        const matchesType = searchQuery.value.propertyType.includes(String(ad.propertyType))
        return matchesCategory && matchesType
    })

    // TRANSMIT EVENT EMIT UPWARD: Offloads view control to the parent layout controller
    emit('on-search-success', filteredResults)
}

defineExpose({
    focusInput: () => buyLocationInputRef.value?.focus()
})
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- POSITION 1: Category Selection Row (Borderless Flat Design) -->
        <div class="filter-vertical-row remove-bottom-gap">
            <div class="borderless-flat-radio-row"
                :class="{ 'radio-validation-alert': validationError && !searchQuery.category, 'shake-error-cue': triggerShake && !searchQuery.category }">
                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.category === '0' }">
                    <input type="radio" name="category" value="0" v-model="searchQuery.category"
                        @change="handleCategoryChange" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">Private</span>
                </label>

                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.category === '1' }">
                    <input type="radio" name="category" value="1" v-model="searchQuery.category"
                        @change="handleCategoryChange" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">Commercial</span>
                </label>
            </div>
        </div>

        <!-- Divider Line 1: Always Visible -->
        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- POSITION 2: Property Type Selection Row (Checkboxes Multi-Select Matrix) -->
        <div class="filter-vertical-row">
            <div v-if="!searchQuery.category" class="category-selection-required-prompt">
                Please select a category above to view available property types.
            </div>

            <div v-else class="borderless-flat-radio-row mobile-wrapping-radio-row"
                :class="{ 'radio-validation-alert': validationError && searchQuery.propertyType.length === 0 }">
                <label v-for="item in dynamicPropertyTypes" :key="item.value" class="flat-radio-label-node"
                    :class="{ 'is-active-node': searchQuery.propertyType.includes(item.value) }">
                    <input type="checkbox" name="propertyType" :value="item.value" v-model="searchQuery.propertyType"
                        @change="handleTypeChange" class="hidden-radio-input" />
                    <span class="custom-checkbox-square"></span>
                    <span class="label-caption-string">{{ item.label }}</span>
                </label>
            </div>
        </div>

        <!-- Divider Line 2: Always Visible -->
        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- POSITION 3: Budget Tier Selection Row -->
        <div class="filter-vertical-row"
            :class="{ 'row-disabled-state': searchQuery.propertyType.length === 0 || !searchQuery.category }">
            <div class="borderless-flat-radio-row mobile-wrapping-radio-row">
                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '1' }">
                    <input type="radio" name="priceScale" :disabled="searchQuery.propertyType.length === 0" value="1"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">Under ₹50 Lakh</span>
                </label>

                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '2' }">
                    <input type="radio" name="priceScale" :disabled="searchQuery.propertyType.length === 0" value="2"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">₹50 L - ₹1 Cr</span>
                </label>

                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '3' }">
                    <input type="radio" name="priceScale" :disabled="searchQuery.propertyType.length === 0" value="3"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">₹1 Cr - ₹3 Cr</span>
                </label>

                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '4' }">
                    <input type="radio" name="priceScale" :disabled="searchQuery.propertyType.length === 0" value="4"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">Above ₹3 Cr</span>
                </label>
            </div>
        </div>

        <!-- Divider Line 3: Always Visible -->
        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- POSITION 4: Location Entry Search Box -->
        <div class="filter-vertical-row">
            <div class="flat-form-field">
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input ref="buyLocationInputRef" type="text" placeholder="Search by city, area name, or PIN..."
                    class="flat-raw-input" v-model="searchQuery.queryText" />
            </div>
        </div>

        <!-- Search Submit Button -->
        <div class="flat-btn-row-wrapper">
            <button @click="executePropertySearch" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span class="btn-label-text">Search Properties</span>
            </button>
        </div>

    </div>
</template>

<style scoped>
.vertical-stack-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
}

.filter-vertical-row {
    width: 100%;
    display: flex;
    align-items: center;
    min-height: 28px;
    transition: var(--transition-smooth);
}

.remove-bottom-gap {
    margin-bottom: -4px;
}

.divider-line-container {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 4px 0;
}

.horizontal-hairline-divider {
    display: block;
    width: 100%;
    height: 1.5px;
    background-color: rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .horizontal-hairline-divider {
    background-color: rgba(255, 255, 255, 0.08);
}

.category-selection-required-prompt {
    font-size: 13.5px;
    font-weight: 600;
    color: #78889b;
    letter-spacing: 0.1px;
    padding: 4px 0;
}

[data-theme="dark"] .category-selection-required-prompt {
    color: rgba(255, 255, 255, 0.4);
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

.shake-error-cue {
    animation: structuralShake 0.45s ease-in-out;
}

@keyframes structuralShake {

    0%,
    100% {
        transform: translateX(0);
    }

    20%,
    60% {
        transform: translateX(-6px);
    }

    40%,
    80% {
        transform: translateX(6px);
    }
}
</style>
