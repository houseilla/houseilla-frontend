<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { advertisementService } from '../../../../services/advertisementService';
import type { Advertisement, AdvertisementImage } from '../../../../models/advertisement';
import {
    AdvertisementPropertyType,
    AdvertisementPurpose
} from '../../../../models/advertisementEnums';
import {
    usePropertySelection,
    MAX_COMPARE_ITEMS
} from '../../../../composables/usePropertySelection';

const route = useRoute();
const router = useRouter();

const {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelectListing,
    clearSelectedListings
} = usePropertySelection();

const PAGE_SIZE = 12;

const isLoading = ref(true);
const fetchError = ref('');
const listings = ref<Advertisement[]>([]);
const coverImageMap = ref<Record<number, string>>({});

// Pagination State (0-based for Spring Data, displayed 1-based to user)
const currentPage = ref(0);
const totalPages = ref(0);
const totalElements = ref(0);

// --- Parse URL Query Filters ---
const selectedPurposes = computed<number[]>(() => {
    const raw = String(route.query.purposes ?? route.query.purpose ?? '').trim();
    if (!raw) return [];
    return raw.split(',').map(Number).filter(n => !Number.isNaN(n));
});

const selectedTypes = computed<number[]>(() => {
    const raw = String(route.query.types || '').trim();
    if (!raw) return [];
    return raw.split(',').map(Number).filter(n => !Number.isNaN(n));
});

const exactPincode = computed<string>(() => String(route.query.pincode || '').trim());
const locationTextQuery = computed<string>(() => String(route.query.q || '').trim());

// --- Display Helpers ---
const formatPropertyType = (type: AdvertisementPropertyType): string => {
    switch (Number(type)) {
        case AdvertisementPropertyType.PRIVATE_LAND: return 'Private Land';
        case AdvertisementPropertyType.FLAT: return 'Flat';
        case AdvertisementPropertyType.HOUSE: return 'House';
        case AdvertisementPropertyType.OFFICE: return 'Office';
        case AdvertisementPropertyType.SHOP: return 'Shop';
        case AdvertisementPropertyType.COMMERCIAL_LAND: return 'Commercial Land';
        case AdvertisementPropertyType.WAREHOUSE: return 'Warehouse';
        default: return 'Property';
    }
};

const formatPurposeLabel = (purpose: AdvertisementPurpose): string => {
    switch (Number(purpose)) {
        case AdvertisementPurpose.SALE: return 'For Sale';
        case AdvertisementPurpose.RENT: return 'For Rent';
        case AdvertisementPurpose.LEASE: return 'For Lease';
        default: return '';
    }
};

const formatIndianPrice = (price: number, purpose: AdvertisementPurpose): string => {
    const amount = Number(price || 0);
    if (Number(purpose) !== AdvertisementPurpose.SALE) {
        return `₹${amount.toLocaleString('en-IN')} / mo`;
    }
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2).replace(/\.00$/, '')} Lakh`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
};

const buildImageSrc = (img: AdvertisementImage): string => {
    const raw = img.base64Data || img.file || '';
    if (!raw) return '';
    if (raw.startsWith('data:')) return raw;
    return `data:${img.type || 'image/jpeg'};base64,${raw}`;
};

const visiblePageNumbers = computed<number[]>(() => {
    const total = totalPages.value;
    if (total <= 1) return [];
    const current = currentPage.value + 1;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
        pages.push(p);
    }
    return pages;
});

const loadListings = async () => {
    isLoading.value = true;
    fetchError.value = '';

    const pageFromUrl = route.query.page ? Math.max(0, Number(route.query.page) || 0) : 0;

    try {
        const pageData = await advertisementService.searchAdvertisements({
            purpose: route.query.purpose ? String(route.query.purpose) : undefined,
            ...(route.query.purposes ? { purposes: String(route.query.purposes) } : {}),
            types: route.query.types ? String(route.query.types) : undefined,
            budget: route.query.budget ? String(route.query.budget) : undefined,
            pincode: route.query.pincode ? String(route.query.pincode) : undefined,
            pincodes: route.query.pincodes ? String(route.query.pincodes) : undefined,
            q: route.query.q ? String(route.query.q) : undefined,
            page: pageFromUrl,
            size: PAGE_SIZE
        });

        listings.value = pageData.content;
        currentPage.value = pageData.number;
        totalPages.value = pageData.totalPages;
        totalElements.value = pageData.totalElements;

        await Promise.all(
            pageData.content.map(async (ad) => {
                if (coverImageMap.value[ad.id]) return;
                try {
                    const media = await advertisementService.getAdvertisementImages(ad.id);
                    const firstPhoto = media.find(m => !m.type?.startsWith('video/')) || media.at(0);
                    if (firstPhoto) {
                        const src = buildImageSrc(firstPhoto);
                        if (src) coverImageMap.value[ad.id] = src;
                    }
                } catch {
                    // Ignore missing media
                }
            })
        );
    } catch (err) {
        console.error('Failed to search property listings:', err);
        fetchError.value = 'Unable to connect to the server to load properties.';
    } finally {
        isLoading.value = false;
    }
};

const goToComparePage = () => {
    if (selectedCount.value < 2) return;
    const idsParam = selectedIds.value.slice(0, MAX_COMPARE_ITEMS).join(',');
    router.push({
        path: '/compare',
        query: { ids: idsParam }
    });
};

const goToEnquiryPage = () => {
    if (selectedCount.value < 1) return;
    const idsParam = selectedIds.value.join(',');
    router.push({
        path: '/enquiry',
        query: { ids: idsParam }
    });
};

const goToPage = (zeroBasedPage: number) => {
    if (zeroBasedPage < 0 || zeroBasedPage >= totalPages.value || zeroBasedPage === currentPage.value) {
        return;
    }
    router.push({
        path: '/listings',
        query: {
            ...route.query,
            page: String(zeroBasedPage)
        }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const goBackToSearch = () => {
    router.push('/');
};

const openPropertyDetails = (propertyId: number) => {
    router.push(`/property/${propertyId}`);
};

onMounted(loadListings);
watch(() => route.query, loadListings);
</script>

<template>
    <div class="listings-page-shell">
        <div class="listings-inner-container">

            <!-- Top Header Bar -->
            <div class="universal-view-header-row">
                <div>
                    <h1 class="universal-view-main-title">
                        {{ isLoading ? 'Searching Properties...' : `${totalElements} Properties Found` }}
                    </h1>
                    <p class="listings-subtitle-text">
                        <span v-if="!isLoading && totalPages > 0">
                            Page {{ currentPage + 1 }} of {{ totalPages }} ·
                        </span>
                        Click the top-right circle on tiles to select, compare, or enquire
                    </p>
                </div>

                <button type="button" @click="goBackToSearch" class="universal-back-arrow-btn"
                    title="Back to Search">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <!-- Active Filter Summary Pills -->
            <div class="active-filters-strip">
                <span v-for="p in selectedPurposes" :key="`purpose-${p}`" class="filter-chip-pill">
                    {{ formatPurposeLabel(p) }}
                </span>
                <span v-for="t in selectedTypes" :key="`type-${t}`" class="filter-chip-pill">
                    {{ formatPropertyType(t) }}
                </span>
                <span v-if="exactPincode" class="filter-chip-pill">
                    PIN: {{ exactPincode }}
                </span>
                <span v-else-if="locationTextQuery" class="filter-chip-pill">
                    Location: "{{ locationTextQuery }}"
                </span>
            </div>

            <!-- Loading / Error / Empty States -->
            <div v-if="isLoading" class="listings-status-box">
                Loading matching properties from HouseiLLA...
            </div>

            <div v-else-if="fetchError" class="listings-status-box is-error-box">
                {{ fetchError }}
            </div>

            <div v-else-if="listings.length === 0" class="listings-status-box">
                <p style="font-weight: 700; margin-bottom: 8px;">No properties matched these exact filters.</p>
                <p style="opacity: 0.65; margin-bottom: 16px;">Try broadening your location or selecting another property type.</p>
                <button type="button" @click="goBackToSearch" class="flat-full-width-action-btn"
                    style="max-width: 240px; margin: 0 auto;">
                    <span class="btn-label-text">Back to Search Filters</span>
                </button>
            </div>
            <!-- 4-Column Neomorphic Property Card Grid -->
            <template v-else>
                <div class="tiles-four-col-grid">
                    <div v-for="item in listings" :key="item.id"
                        class="shared-grid-tile is-solid-item-tile property-result-card"
                        :class="{ 'is-selected-card': isSelected(item.id) }"
                        @click="openPropertyDetails(item.id)">

                        <!-- Cover Photo or Clean Placeholder -->
                        <div class="property-cover-frame">
                            <img v-if="coverImageMap[item.id]" :src="coverImageMap[item.id]" :alt="item.areaName"
                                class="property-cover-img" />
                            <div v-else class="property-cover-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                                    class="placeholder-home-svg">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                <span>{{ formatPropertyType(item.propertyType) }}</span>
                            </div>

                            <span class="purpose-corner-badge">
                                {{ formatPurposeLabel(item.purpose) }}
                            </span>
                            <span v-if="item.isPremium === 1" class="premium-corner-badge">
                                Premium
                            </span>

                            <!-- Circular Top-Right Tile Select Button -->
                            <button
                                type="button"
                                class="card-select-toggle-btn"
                                :class="{ 'is-checked': isSelected(item.id) }"
                                :title="isSelected(item.id) ? 'Deselect property' : 'Select property'"
                                @click.stop="toggleSelectListing(item)"
                            >
                                <svg
                                    v-if="isSelected(item.id)"
                                    class="card-select-check-svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="3"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span v-else class="card-select-ring"></span>
                            </button>
                        </div>

                        <!-- Card Body -->
                        <div class="property-card-body">
                            <div class="property-price-headline">
                                {{ formatIndianPrice(item.price, item.purpose) }}
                            </div>

                            <div class="property-title-line">
                                {{ formatPropertyType(item.propertyType) }} in {{ item.areaName }}
                            </div>

                            <div class="property-address-subline line-clamp-1">
                                {{ item.addressLine1 }}<span v-if="item.district">, {{ item.district }}</span>
                                <span v-if="item.pincode"> - {{ item.pincode }}</span>
                            </div>

                            <p class="property-desc-snippet">
                                {{ item.description || 'Verified listing on HouseiLLA.' }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Neomorphic Pagination Controls -->
                <div v-if="totalPages > 1" class="pagination-bar-row shadow-clipping-safe-zone">
                    <button type="button" class="page-nav-btn" :disabled="currentPage === 0"
                        @click="goToPage(currentPage - 1)">
                        Previous
                    </button>

                    <div class="page-numbers-group">
                        <button v-for="pageNum in visiblePageNumbers" :key="pageNum" type="button"
                            class="page-number-btn" :class="{ 'is-current-page': pageNum - 1 === currentPage }"
                            @click="goToPage(pageNum - 1)">
                            {{ pageNum }}
                        </button>
                    </div>

                    <button type="button" class="page-nav-btn" :disabled="currentPage >= totalPages - 1"
                        @click="goToPage(currentPage + 1)">
                        Next
                    </button>
                </div>
            </template>
            <!-- Bottom-Right Capsule Pill: [ Compare | Enquiry ] -->
            <div v-if="selectedCount > 0" class="floating-selection-pill-group animate-fade-in">
                <button
                    type="button"
                    class="floating-clear-pill-btn"
                    title="Clear selection"
                    @click="clearSelectedListings"
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div class="floating-joined-pill-bar">
                    <button
                        type="button"
                        class="floating-joined-half-btn is-compare-half"
                        :disabled="selectedCount < 2"
                        :title="selectedCount < 2 ? 'Select at least 2 properties to compare' : 'Compare selected properties'"
                        @click="goToComparePage"
                    >
                        Compare ({{ Math.min(selectedCount, MAX_COMPARE_ITEMS) }})
                    </button>

                    <button
                        type="button"
                        class="floating-joined-half-btn is-enquiry-half"
                        title="Send enquiry for selected properties"
                        @click="goToEnquiryPage"
                    >
                        Enquiry ({{ selectedCount }})
                    </button>
                </div>
            </div>

        </div>
    </div>
</template>


