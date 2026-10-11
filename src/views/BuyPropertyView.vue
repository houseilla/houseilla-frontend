<script setup lang="ts">
import { ref, computed } from 'vue';
import { AdvertisementPropertyType } from '../models/enums';
import type { Advertisement } from '../models/advertisement';

// 1. IMPORT YOUR MOCKUP DATABASE FILE HERE
import { mockAdvertisements } from '../mocks/advertisements';

const buyLocationInputRef = ref<HTMLInputElement | null>(null);
const validationError = ref(false);
const triggerShake = ref(false);
const errorMessage = ref('');

// DEFINE CUSTOM EVENT EMITTER: Used to send filtered data up to parent HomeView hub layer
const emit = defineEmits(['on-search-success']);

// SEARCH QUERY FORM MODELS
const searchQuery = ref({
    category: '',         // Position 1: "0" for Private, "1" for Commercial
    propertyType: [] as string[], // Position 2: Checkbox array tracker
    priceScale: '',       // Position 3: Optional parameter
    queryText: ''         // Position 4: Optional location string parameter
});

// Position 2: Dynamic Chained Property Type Logic
const dynamicPropertyTypes = computed(() => {
    if (searchQuery.value.category === '0') {
        return [
            { value: String(AdvertisementPropertyType.PRIVATE_LAND), label: 'Private Land' },
            { value: String(AdvertisementPropertyType.FLAT), label: 'Flat' },
            { value: String(AdvertisementPropertyType.HOUSE), label: 'House' }
        ];
    } else if (searchQuery.value.category === '1') {
        return [
            { value: String(AdvertisementPropertyType.OFFICE), label: 'Office' },
            { value: String(AdvertisementPropertyType.SHOP), label: 'Shop' },
            { value: String(AdvertisementPropertyType.COMMERCIAL_LAND), label: 'Commercial Land' },
            { value: String(AdvertisementPropertyType.WAREHOUSE), label: 'Warehouse' }
        ];
    }
    return [];
});

const handleCategoryChange = () => {
    searchQuery.value.propertyType = [];
    searchQuery.value.priceScale = '';
    validationError.value = false;
    triggerShake.value = false;
};

const handleTypeChange = () => {
    if (searchQuery.value.propertyType.length === 0) {
        searchQuery.value.priceScale = '';
    }
};

// ACTION EXECUTION: Filters mock file records and transmits data upward to parent component hub
const executePropertySearch = () => {
    validationError.value = false;
    triggerShake.value = false;
    errorMessage.value = '';

    // 1. Enforce Mandatory Category Choice (Private / Commercial)
    if (!searchQuery.value.category) {
        validationError.value = true;
        triggerShake.value = true;
        errorMessage.value = 'Please select a property category (Private or Commercial) to proceed.';

        setTimeout(() => { triggerShake.value = false; }, 450);
        return;
    }

    // 2. Enforce Mandatory Sub-Type Checkbox Toggle Matrix Selection
    if (searchQuery.value.propertyType.length === 0) {
        validationError.value = true;
        errorMessage.value = 'Please select at least one property type to filter your search.';
        return;
    }

    // Core Filter Loop Logic queries mock arrays safely if inputs are secure
    const filteredResults = mockAdvertisements.filter(ad => {
        // 1. Match category (Private vs Commercial)
        const matchesCategory = String(ad.category) === searchQuery.value.category;
        // 2. Match sub-type checklists
        const matchesType = searchQuery.value.propertyType.includes(String(ad.propertyType));
        // 3. Match Budget scales dynamically mapping your numeric 'ad.price' configuration
        let matchesPrice = true;
        if (searchQuery.value.priceScale) {
            const priceInLakhs = ad.price / 100000; // Converts absolute price to lakhs variant scale

            if (searchQuery.value.priceScale === '1') {
                matchesPrice = priceInLakhs < 50;                  // Under 50 Lakh
            } else if (searchQuery.value.priceScale === '2') {
                matchesPrice = priceInLakhs >= 50 && priceInLakhs <= 100; // 50 L - 1 Cr
            } else if (searchQuery.value.priceScale === '3') {
                matchesPrice = priceInLakhs > 100 && priceInLakhs <= 300; // 1 Cr - 3 Cr
            } else if (searchQuery.value.priceScale === '4') {
                matchesPrice = priceInLakhs > 300;                 // Above 3 Cr
            }
        }

        // 4. Match Location query text values safely matching your actual address block variables
        let matchesText = true;
        if (searchQuery.value.queryText.trim()) {
            const searchLower = searchQuery.value.queryText.toLowerCase();
            matchesText = (ad.areaName?.toLowerCase().includes(searchLower) || false) ||
                (ad.district?.toLowerCase().includes(searchLower) || false) ||
                String(ad.pincode || '').includes(searchLower);

        }

        return matchesCategory && matchesType && matchesPrice && matchesText;

    });

    emit('on-search-success', filteredResults);
};

defineExpose({
    focusInput: () => buyLocationInputRef.value?.focus()
});
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- POSITION 1: Category Selection Row (Only field highlights on error) -->
        <div class="filter-vertical-row remove-bottom-gap" :class="{ 'shake-error-cue': triggerShake }">
            <div class="borderless-flat-radio-row"
                :class="{ 'is-invalid-field': validationError && !searchQuery.category }">
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

        <!-- Divider Line 1 -->
        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Property Type Checkbox Matrix Row -->
        <div class="filter-vertical-row">
            <span v-if="!searchQuery.category" class="category-selection-required-prompt">
                Please select a category above to view available property types.
            </span>

            <div v-else class="borderless-flat-radio-row mobile-wrapping-radio-row"
                :class="{ 'is-invalid-field': validationError && searchQuery.propertyType.length === 0 }">
                <label v-for="item in dynamicPropertyTypes" :key="item.value" class="flat-radio-label-node"
                    :class="{ 'is-active-node': searchQuery.propertyType.includes(item.value) }">
                    <input type="checkbox" :value="item.value" v-model="searchQuery.propertyType"
                        @change="handleTypeChange" class="hidden-radio-input" />
                    <span class="custom-checkbox-square"></span>
                    <span class="label-caption-string">{{ item.label }}</span>
                </label>
            </div>
        </div>

        <!-- Divider Line 2 -->
        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Budget Tier Selection Row -->
        <div class="filter-vertical-row"
            :class="{ 'row-disabled-state': searchQuery.propertyType.length === 0 || !searchQuery.category }">
            <div class="borderless-flat-radio-row mobile-wrapping-radio-row">
                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '1' }">
                    <input type="radio" name="priceScale" value="1" :disabled="searchQuery.propertyType.length === 0"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">Under ₹50 Lakh</span>
                </label>
                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '2' }">
                    <input type="radio" name="priceScale" value="2" :disabled="searchQuery.propertyType.length === 0"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">₹50 L - ₹1 Cr</span>
                </label>
                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '3' }">
                    <input type="radio" name="priceScale" value="3" :disabled="searchQuery.propertyType.length === 0"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">₹1 Cr - ₹3 Cr</span>
                </label>
                <label class="flat-radio-label-node" :class="{ 'is-active-node': searchQuery.priceScale === '4' }">
                    <input type="radio" name="priceScale" value="4" :disabled="searchQuery.propertyType.length === 0"
                        v-model="searchQuery.priceScale" class="hidden-radio-input" />
                    <span class="custom-radio-dot"></span>
                    <span class="label-caption-string">Above ₹3 Cr</span>
                </label>
            </div>
        </div>

        <!-- Divider Line 3 -->
        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Location Entry Search Box -->
        <div class="filter-vertical-row">
            <div class="flat-form-field">
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input ref="buyLocationInputRef" type="text" class="flat-raw-input"
                    placeholder="Search by city, area name, or PIN..." v-model="searchQuery.queryText" />
            </div>
        </div>

        <!-- POSITION 2: Moved Error Text Placement Node right here above the search action bar button -->
        <div v-if="validationError" class="filter-vertical-row animate-fade-in"
            style="margin-top: -6px; margin-bottom: -6px;">
            <span class="flat-error-descriptor-text">
                {{ errorMessage }}
            </span>
        </div>

        <div v-else class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Search Submit Button Row -->
        <div class="filter-vertical-row">
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

    </div>
</template>


<style scoped>
.row-disabled-state {
    opacity: 0.35;
    pointer-events: none;
    filter: grayscale(1);
    transition: opacity 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
</style>