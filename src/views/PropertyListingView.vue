<script setup lang="ts">
import { ref, computed } from 'vue'
import { AdvertisementPropertyType } from '../models/enums'
import type { Advertisement } from '../models/advertisement'

const emit = defineEmits(['on-card-click'])

// Fixes reactivity by declaring props explicitly without ES6 destructuring
const props = defineProps<{
    advertisements: Advertisement[]
}>()

// Core Switch Trackers
const isGridView = ref(true)
const activeSliderPointersMap = ref<Record<number, number>>({})
const showFilters = ref(true)

// Ribbon Filters Form Reactive States
const innerFilters = ref({
    searchString: '',
    propertyTypeKey: '',
    priceTierKey: '',
    purposeKey: ''
})

/**
 * Dynamically extract unique property types present inside the loaded dataset
 */
const dynamicDropdownTypes = computed(() => {
    const presentTypes = new Set<number>()
    props.advertisements.forEach(ad => {
        if (ad.propertyType !== undefined) presentTypes.add(ad.propertyType)
    })

    const allOptions = [
        { value: String(AdvertisementPropertyType.PRIVATE_LAND), label: 'Private Land' },
        { value: String(AdvertisementPropertyType.HOUSE), label: 'House' },
        { value: String(AdvertisementPropertyType.FLAT), label: 'Flat' },
        { value: String(AdvertisementPropertyType.COMMERCIAL_LAND), label: 'Commercial Land' },
        { value: String(AdvertisementPropertyType.SHOP), label: 'Shop' },
        { value: String(AdvertisementPropertyType.OFFICE), label: 'Office' },
        { value: String(AdvertisementPropertyType.WAREHOUSE), label: 'Warehouse' }
    ]

    return allOptions.filter(opt => presentTypes.has(Number(opt.value)))
})

/**
 * Filters loaded dataset in-memory with zero redundant network requests
 */
const processedAdvertisements = computed(() => {
    return props.advertisements.filter(ad => {
        if (innerFilters.value.searchString.trim() !== '') {
            const query = innerFilters.value.searchString.toLowerCase()
            const matchName = ad.name?.toLowerCase().includes(query)
            const matchDesc = ad.description?.toLowerCase().includes(query)
            const matchLoc = ad.location?.toLowerCase().includes(query)
            const matchArea = ad.areaName?.toLowerCase().includes(query)
            if (!matchName && !matchDesc && !matchLoc && !matchArea) return false
        }

        if (innerFilters.value.propertyTypeKey !== '') {
            if (String(ad.propertyType) !== innerFilters.value.propertyTypeKey) return false
        }

        if (innerFilters.value.purposeKey !== '') {
            if (String(ad.purpose) !== innerFilters.value.purposeKey) return false
        }

        if (innerFilters.value.priceTierKey !== '') {
            const priceVal = ad.price ?? 0
            if (innerFilters.value.priceTierKey === '1' && priceVal >= 5000000) return false
            if (innerFilters.value.priceTierKey === '2' && (priceVal < 5000000 || priceVal > 10000000)) return false
            if (innerFilters.value.priceTierKey === '3' && (priceVal < 10000000 || priceVal > 30000000)) return false
            if (innerFilters.value.priceTierKey === '4' && priceVal <= 30000000) return false
        }

        return true
    })
})

const getActiveImageIndex = (adId: number): number => {
    if (activeSliderPointersMap.value[adId] === undefined) {
        activeSliderPointersMap.value[adId] = 0
    }
    return activeSliderPointersMap.value[adId]
}

const handlePreviousImageSlide = (adId: number, maxImagesCount: number) => {
    if (maxImagesCount <= 1) return
    const currentIndex = getActiveImageIndex(adId)
    activeSliderPointersMap.value[adId] = currentIndex === 0 ? maxImagesCount - 1 : currentIndex - 1
}

const handleNextImageSlide = (adId: number, maxImagesCount: number) => {
    if (maxImagesCount <= 1) return
    const currentIndex = getActiveImageIndex(adId)
    activeSliderPointersMap.value[adId] = currentIndex === maxImagesCount - 1 ? 0 : currentIndex + 1
}
</script>

<template>
    <div class="property-listings-page-deck">

        <!-- SUB-HEADER LAYER: Houses results counter and grouped icon-only controller triggers -->
        <div class="listings-controls-sub-bar">
            <h3 class="listings-results-counter-hint">
                Showing {{ processedAdvertisements.length }} matched real estate listings
            </h3>

            <div class="right-aligned-actions-cluster">

                <!-- Toggle button to expand/collapse filters dropdown block panel -->
                <button @click="showFilters = !showFilters" class="icon-only-neomorphic-action-btn"
                    :class="{ 'action-is-active': showFilters }" title="Toggle Filter Ribbon Options" type="button">
                    <svg class="action-btn-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                </button>

                <!-- Grid view trigger icon -->
                <button @click="isGridView = true" class="icon-only-neomorphic-action-btn"
                    :class="{ 'action-is-active': isGridView }" title="Switch to Grid View" type="button">
                    <svg class="action-btn-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </button>

                <!-- List view trigger icon -->
                <button @click="isGridView = false" class="icon-only-neomorphic-action-btn"
                    :class="{ 'action-is-active': !isGridView }" title="Switch to List View" type="button">
                    <svg class="action-btn-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>

            </div>
        </div>

        <!-- ACCORDION EXPANSION BAR: Opens borderless input cells cleanly from top down -->
        <Transition name="accordion-slide">
            <div v-if="showFilters" class="collapsible-filters-outer-container">
                <div class="borderless-horizontal-filter-ribbon-bar">

                    <div class="ribbon-filter-input-cell box-search-cell">
                        <svg class="ribbon-cell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" placeholder="Filter by name, city, keyword..."
                            class="ribbon-raw-textbox-input" v-model="innerFilters.searchString" />
                    </div>

                    <div class="ribbon-filter-input-cell dropdown-cell-track">
                        <select v-model="innerFilters.propertyTypeKey" class="ribbon-raw-select-node">
                            <option value="">All Property Types</option>
                            <option v-for="opt in dynamicDropdownTypes" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>

                    <div class="ribbon-filter-input-cell dropdown-cell-track">
                        <select v-model="innerFilters.priceTierKey" class="ribbon-raw-select-node">
                            <option value="">Any Budget Tier</option>
                            <option value="1">Under ₹50 Lakh</option>
                            <option value="2">₹50 Lakh - ₹1 Cr</option>
                            <option value="3">₹1 Cr - ₹3 Cr</option>
                            <option value="4">Above ₹3 Cr</option>
                        </select>
                    </div>

                    <div class="ribbon-filter-input-cell dropdown-cell-track">
                        <select v-model="innerFilters.purposeKey" class="ribbon-raw-select-node">
                            <option value="">Sale & Rent (All)</option>
                            <option value="0">For Sale Only</option>
                            <option value="1">For Rent Only</option>
                        </select>
                    </div>

                </div>
            </div>
        </Transition>

        <!-- EMPTY STATE FALLBACK WINDOW PANEL -->
        <div v-if="processedAdvertisements.length === 0" class="empty-state-debug-hint">
            No active advertisements found matching your current filter parameters.
        </div>

        <!-- DYNAMIC LISTINGS VIEWER GRID TRACK -->
        <div v-else :class="isGridView ? 'premium-properties-grid-layout' : 'premium-properties-list-layout'">
            <div v-for="ad in processedAdvertisements" :key="ad.advertisementId"
                class="neomorphic-property-card-wrapper" @click="emit('on-card-click', ad)" style="cursor: pointer;">

                <!-- Image Slider Viewport Enclosure -->
                <div class="card-image-slider-viewport">
                    <div class="card-badge-row-overlay">
                        <span class="flat-pill-badge" :class="ad.purpose === 0 ? 'badge-sale' : 'badge-rent'">
                            {{ ad.purpose === 0 ? 'For Sale' : 'Rent' }}
                        </span>
                        <span class="flat-pill-badge badge-verified">Verified</span>
                    </div>

                    <!-- Real Image Carousel (Rendered if media files are mapped to ad record) -->
                    <template v-if="ad.images && ad.images.length > 0">
                        <button v-if="ad.images.length > 1"
                            @click="handlePreviousImageSlide(ad.advertisementId, ad.images.length)"
                            class="slider-nav-arrow arrow-left" type="button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="3">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>

                        <!-- Optional chaining syntax fixes strict ts-plugin underline error triggers -->
                        <img :src="ad.images?.[getActiveImageIndex(ad.advertisementId)]?.base64Data" :alt="ad.name"
                            class="slider-img-element" />

                        <button v-if="ad.images.length > 1"
                            @click="handleNextImageSlide(ad.advertisementId, ad.images.length)"
                            class="slider-nav-arrow arrow-right" type="button">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="3">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>

                        <div v-if="ad.images.length > 1" class="slider-dots-indicator-row">
                            <span v-for="(_, index) in ad.images" :key="index" class="carousel-dot-marker"
                                :class="{ 'marker-is-active': index === getActiveImageIndex(ad.advertisementId) }"></span>
                        </div>
                    </template>

                    <!-- Fallback Placeholder Graphic Node -->
                    <template v-else>
                        <div class="fallback-placeholder-graphic-box">
                            <svg class="fallback-vector-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <span class="fallback-text-string">No Image Uploaded</span>
                        </div>
                    </template>
                </div>

                <!-- Real Estate Meta Parameter Details Box -->
                <div class="card-textual-details-enclosure">
                    <div class="card-top-structural-row">
                        <span class="property-area-district-label">📍 {{ ad.areaName }}, {{ ad.location }}</span>
                        <span class="property-pricing-currency-badge">₹{{ ad.price !== undefined ? (ad.price /
                            100000).toFixed(1) :
                            '0.0' }} Lakh</span>
                    </div>

                    <h4 class="property-main-display-heading" :title="ad.name">{{ ad.name }}</h4>
                    <p class="property-textual-description-paragraph">{{ ad.description }}</p>

                    <div class="card-technical-specs-footer-row">
                        <span class="spec-metadata-pill">PIN {{ ad.pincode }}</span>
                        <span class="spec-metadata-pill">ID #{{ ad.advertisementId }}</span>
                    </div>
                </div>

            </div>
        </div>

    </div>
</template>

<style scoped>
/* ==========================================================================
   1. Sub-Header Layout Tracks & Metrics Controls Bar
   ========================================================================== */
.listings-controls-sub-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: -12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    padding-bottom: 12px;
    margin-bottom: 24px;
}

[data-theme="dark"] .listings-controls-sub-bar {
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.listings-results-counter-hint {
    font-size: 13.5px;
    opacity: 0.6;
    font-weight: 600;
    color: var(--text-color);
}

.right-aligned-actions-cluster {
    display: flex;
    align-items: center;
    gap: 10px;
}

/* ==========================================================================
   2. REQUIREMENT FIXED: Flattened, Borderless Icon Action Buttons
   ========================================================================== */
.icon-only-neomorphic-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background-color: rgba(0, 0, 0, 0.03);
    /* Flat subtle tint replaces neomorphic drop-shadow */
    color: var(--text-color);
    cursor: pointer;
    opacity: 0.6;
    box-shadow: none !important;
    /* Forces drop shadow pop out entirely */
    transition: var(--transition-smooth);
}

[data-theme="dark"] .icon-only-neomorphic-action-btn {
    background-color: rgba(255, 255, 255, 0.04);
}

.icon-only-neomorphic-action-btn:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .icon-only-neomorphic-action-btn:hover {
    background-color: rgba(255, 255, 255, 0.08);
}

/* Selected Flat State: Crisp contrast accent bounding colors */
.icon-only-neomorphic-action-btn.action-is-active {
    background-color: rgba(0, 119, 182, 0.1);
    color: var(--accent-color);
    opacity: 1;
    box-shadow: none !important;
}

[data-theme="dark"] .icon-only-neomorphic-action-btn.action-is-active {
    background-color: rgba(0, 180, 216, 0.15);
}

.action-btn-svg-icon {
    width: 14px;
    height: 14px;
}

/* ==========================================================================
   3. Borderless Horizontal Filter Ribbon Layout Framework
   ========================================================================== */
.collapsible-filters-outer-container {
    width: 100%;
    overflow: hidden;
}

.borderless-horizontal-filter-ribbon-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 4px 2px 24px 2px;
    background-color: transparent;
}

.ribbon-filter-input-cell {
    position: relative;
    height: 42px;
    background-color: var(--bg-color);
    border: 1.5px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    transition: var(--transition-smooth);
}

[data-theme="dark"] .ribbon-filter-input-cell {
    border: 1.5px solid rgba(0, 0, 0, 0.07);
}

.box-search-cell {
    flex: 1.4;
}

.dropdown-cell-track {
    flex: 1;
    padding: 0;
}

.ribbon-cell-icon {
    width: 14px;
    height: 14px;
    color: var(--text-color);
    opacity: 0.4;
    flex-shrink: 0;
}

.ribbon-raw-textbox-input {
    border: none;
    background: transparent;
    outline: none;
    width: 100%;
    height: 100%;
    padding-left: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
}

.ribbon-raw-textbox-input::placeholder {
    color: var(--text-color);
    opacity: 0.35;
}

.ribbon-raw-select-node {
    border: none;
    background: transparent;
    outline: none;
    width: 100%;
    height: 100%;
    padding: 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
    cursor: pointer;
}

.ribbon-filter-input-cell:focus-within {
    border-color: var(--accent-color);
}

/* ==========================================================================
   4. Premium Grid Matrix & List Stream Containers Proportions
   ========================================================================== */
.premium-properties-grid-layout {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 24px;
    width: 100%;
    padding-bottom: 40px;
}

.premium-properties-list-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    padding-bottom: 40px;
}

.neomorphic-property-card-wrapper {
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-shadow: var(--neomorphic-flat);
    background-color: var(--bg-color);
    transition: var(--transition-smooth);
}

.premium-properties-list-layout .neomorphic-property-card-wrapper {
    flex-direction: row;
    height: 180px;
}

/* ==========================================================================
   5. Slider Carousels Viewports & Fallback Placeholder Vectors
   ========================================================================== */
.card-image-slider-viewport {
    position: relative;
    width: 100%;
    height: 150px;
    background-color: rgba(0, 0, 0, 0.02);
    overflow: hidden;
    flex-shrink: 0;
}

.premium-properties-list-layout .card-image-slider-viewport {
    width: 240px;
    height: 100%;
}

.slider-img-element {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s cubic-bezier(0.1, 0.8, 0.3, 1);
}

.neomorphic-property-card-wrapper:hover .slider-img-element {
    transform: scale(1.025);
}

.slider-nav-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background-color: rgba(240, 242, 245, 0.88);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2c3e50;
    cursor: pointer;
    z-index: 4;
    opacity: 0;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transition: opacity 0.25s ease, background-color 0.2s;
}

[data-theme="dark"] .slider-nav-arrow {
    background-color: rgba(26, 34, 45, 0.88);
    color: #ecf0f1;
}

.neomorphic-property-card-wrapper:hover .slider-nav-arrow {
    opacity: 1;
}

.slider-nav-arrow:hover {
    background-color: var(--bg-color);
    color: var(--accent-color);
}

.arrow-left {
    left: 10px;
}

.arrow-right {
    right: 10px;
}

.slider-dots-indicator-row {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 5px;
    z-index: 4;
}

.carousel-dot-marker {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
}

.carousel-dot-marker.marker-is-active {
    background-color: #ffffff;
    width: 12px;
    border-radius: 2.5px;
}

.fallback-placeholder-graphic-box {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: rgba(0, 0, 0, 0.015);
}

[data-theme="dark"] .fallback-placeholder-graphic-box {
    background-color: rgba(255, 255, 255, 0.008);
}

.fallback-vector-icon {
    width: 32px;
    height: 32px;
    color: var(--text-color);
    opacity: 0.2;
}

.fallback-text-string {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-color);
    opacity: 0.35;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* ==========================================================================
   6. Typography Descriptions & Layout Metadatas
   ========================================================================== */
.card-textual-details-enclosure {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.premium-properties-list-layout .card-textual-details-enclosure {
    padding: 16px 20px;
    height: 100%;
}

.card-top-structural-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    width: 100%;
}

.property-area-district-label {
    font-size: 11.5px;
    font-weight: 700;
    color: var(--accent-color);
}

.property-pricing-currency-badge {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-color);
}

.property-main-display-heading {
    font-size: 14.5px;
    font-weight: 800;
    color: var(--text-color);
    margin-bottom: 6px;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* WARNING FIX: Added standard line-clamp to satisfy vendor compilation plugin checks */
.property-textual-description-paragraph {
    font-size: 12px;
    font-weight: 500;
    opacity: 0.65;
    color: var(--text-color);
    line-height: 1.4;
    margin-bottom: auto;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.card-technical-specs-footer-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
}

.spec-metadata-pill {
    font-size: 10.5px;
    font-weight: 700;
    padding: 3px 6px;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.025);
    color: var(--text-color);
    opacity: 0.55;
}

[data-theme="dark"] .spec-metadata-pill {
    background-color: rgba(255, 255, 255, 0.025);
}

.card-badge-row-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 5;
    display: flex;
    gap: 5px;
}

.flat-pill-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge-sale {
    background-color: #0077b6;
    color: #ffffff;
}

.badge-rent {
    background-color: #e67e22;
    color: #ffffff;
}

.badge-verified {
    background-color: #2ecc71;
    color: #ffffff;
}

.empty-state-debug-hint {
    font-size: 14px;
    opacity: 0.5;
    padding: 16px 0;
    color: var(--text-color);
}

/* ==========================================================================
   7. Accordion Slide Animation Timelines & Viewport Media Queries
   ========================================================================== */
.accordion-slide-enter-active,
.accordion-slide-leave-active {
    transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
    max-height: 200px;
}

.accordion-slide-enter-from,
.accordion-slide-leave-to {
    max-height: 0;
    opacity: 0;
}

@media (max-width: 768px) {
    .borderless-horizontal-filter-ribbon-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 8px 2px;
    }

    .ribbon-filter-input-cell {
        width: 100%;
    }

    .accordion-slide-enter-active,
    .accordion-slide-leave-active {
        max-height: 300px;
    }
}

@media (max-width: 580px) {
    .premium-properties-list-layout .neomorphic-property-card-wrapper {
        flex-direction: column;
        height: auto;
    }

    .premium-properties-list-layout .card-image-slider-viewport {
        width: 100%;
        height: 160px;
    }

    .listings-controls-sub-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}
</style>