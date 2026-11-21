<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { advertisementService } from '../../../../services/advertisementService';
import type { Advertisement, AdvertisementImage } from '../../../../models/advertisement';
import {
    AdvertisementPropertyType,
    AdvertisementPurpose
} from '../../../../models/advertisementEnums';
import { usePropertySelection } from '../../../../composables/usePropertySelection';
import PropertyImageSlider from '../../../../components/PropertyImageSlider.vue';

const route = useRoute();
const router = useRouter();
const { isSelected, toggleSelectListing } = usePropertySelection();

const isLoading = ref(true);
const loadError = ref('');
const property = ref<Advertisement | null>(null);
const mediaList = ref<AdvertisementImage[]>([]);

const propertyId = computed<number>(() => Number(route.params.id) || 0);

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

const formattedPostedDate = computed<string>(() => {
    if (!property.value?.createDate) return '—';
    const parsed = new Date(property.value.createDate);
    if (Number.isNaN(parsed.getTime())) return property.value.createDate;
    return parsed.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
});

const loadPropertyDetails = async () => {
    if (!propertyId.value) {
        loadError.value = 'Invalid property ID.';
        isLoading.value = false;
        return;
    }

    isLoading.value = true;
    loadError.value = '';

    try {
        const [ad, media] = await Promise.all([
            advertisementService.getAdvertisementById(propertyId.value),
            advertisementService.getAdvertisementImages(propertyId.value).catch(() => [])
        ]);
        property.value = ad;
        mediaList.value = media;
    } catch (err) {
        console.error('Failed to load property details:', err);
        loadError.value = 'Unable to load this property. It may have been removed.';
    } finally {
        isLoading.value = false;
    }
};

const enquireNow = () => {
    if (!property.value) return;
    router.push({
        path: '/enquiry',
        query: { ids: String(property.value.id) }
    });
};

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push('/listings');
    }
};

onMounted(loadPropertyDetails);
watch(() => route.params.id, loadPropertyDetails);
</script>
<template>
    <div class="listings-page-shell">
        <div class="listings-inner-container" style="max-width: 1080px;">

            <!-- Header -->
            <div class="universal-view-header-row">
                <div>
                    <h1 class="universal-view-main-title">
                        {{
                            isLoading
                                ? 'Loading Property...'
                                : property
                                  ? `${formatPropertyType(property.propertyType)} in ${property.areaName}`
                                  : 'Property Details'
                        }}
                    </h1>
                    <p v-if="property" class="listings-subtitle-text">
                        Listing #{{ property.id }} · {{ formatPurposeLabel(property.purpose) }}
                        <span v-if="property.isPremium === 1"> · Premium Listing</span>
                    </p>
                </div>

                <button type="button" @click="goBack" class="universal-back-arrow-btn" title="Back">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <!-- Loading / Error -->
            <div v-if="isLoading" class="listings-status-box">
                Loading property details from HouseiLLA...
            </div>

            <div v-else-if="loadError || !property" class="listings-status-box is-error-box">
                <p style="margin-bottom: 16px;">{{ loadError || 'Property not found.' }}</p>
                <button type="button" @click="router.push('/listings')" class="flat-full-width-action-btn"
                    style="max-width: 240px; margin: 0 auto;">
                    <span class="btn-label-text">Back to Listings</span>
                </button>
            </div>

            <!-- Main Property Content -->
            <div v-else class="vertical-stack-form animate-fade-in">

                <!-- Reusable Image Slider Card -->
                <div class="neomorphic-card-base" style="padding: 18px; border-radius: 16px;">
                    <PropertyImageSlider
                        :media="mediaList"
                        :alt-text="`${formatPropertyType(property.propertyType)} in ${property.areaName}`"
                        height="400px"
                        :show-thumbnails="true"
                        :placeholder-label="`No Photos for This ${formatPropertyType(property.propertyType)}`"
                    />
                </div>
                <!-- Price & Primary Action Bar -->
                <div class="neomorphic-card-base"
                    style="padding: 24px; border-radius: 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span class="filter-chip-pill">{{ formatPurposeLabel(property.purpose) }}</span>
                            <span class="filter-chip-pill">{{ formatPropertyType(property.propertyType) }}</span>
                            <span v-if="property.isPremium === 1"
                                style="padding: 4px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 800; background: #ffd71a; color: #1a222d;">
                                Premium
                            </span>
                        </div>

                        <div style="font-size: 28px; font-weight: 800; color: var(--accent-color);">
                            {{ formatIndianPrice(property.price, property.purpose) }}
                        </div>

                        <div style="font-size: 13.5px; font-weight: 600; opacity: 0.72; margin-top: 4px;">
                            <span v-if="property.propertyNumber">#{{ property.propertyNumber }}, </span>
                            {{ property.addressLine1 }}<span v-if="property.addressLine2">, {{ property.addressLine2 }}</span>,
                            {{ property.areaName }}<span v-if="property.district">, {{ property.district }}</span>
                            <span v-if="property.pincode"> - {{ property.pincode }}</span>
                        </div>
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                        <button type="button"
                            @click="toggleSelectListing(property)"
                            style="height: 46px; padding: 0 20px; border-radius: 12px; font-size: 13.5px; font-weight: 700; cursor: pointer; border: 1.5px solid var(--text-color); background: transparent; color: var(--text-color);">
                            {{ isSelected(property.id) ? '✓ Selected' : '+ Select' }}
                        </button>

                        <button type="button"
                            @click="enquireNow"
                            style="height: 46px; padding: 0 24px; border-radius: 12px; font-size: 13.5px; font-weight: 800; cursor: pointer; border: none; background: var(--accent-color); color: #ffffff;">
                            Enquire Now
                        </button>
                    </div>
                </div>

                <!-- Base Property Overview Grid -->
                <div class="neomorphic-card-base" style="padding: 24px; border-radius: 16px;">
                    <h2 style="font-size: 16px; font-weight: 800; margin-bottom: 14px;">
                        Property Overview
                    </h2>
                    <div class="tiles-three-col-grid">
                        <div style="padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);">
                            <div class="flat-field-top-label">Property Type</div>
                            <div style="font-size: 14px; font-weight: 700; margin-top: 3px;">
                                {{ formatPropertyType(property.propertyType) }}
                            </div>
                        </div>

                        <div style="padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);">
                            <div class="flat-field-top-label">Listing Purpose</div>
                            <div style="font-size: 14px; font-weight: 700; margin-top: 3px;">
                                {{ formatPurposeLabel(property.purpose) }}
                            </div>
                        </div>

                        <div style="padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);">
                            <div class="flat-field-top-label">Locality / Area</div>
                            <div style="font-size: 14px; font-weight: 700; margin-top: 3px;">
                                {{ property.areaName || '—' }}
                            </div>
                        </div>

                        <div style="padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);">
                            <div class="flat-field-top-label">District &amp; PIN</div>
                            <div style="font-size: 14px; font-weight: 700; margin-top: 3px;">
                                {{ property.district || '—' }}<span v-if="property.pincode"> ({{ property.pincode }})</span>
                            </div>
                        </div>

                        <div style="padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);">
                            <div class="flat-field-top-label">Property / Plot No.</div>
                            <div style="font-size: 14px; font-weight: 700; margin-top: 3px;">
                                {{ property.propertyNumber || '—' }}
                            </div>
                        </div>

                        <div style="padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.08);">
                            <div class="flat-field-top-label">Listed On</div>
                            <div style="font-size: 14px; font-weight: 700; margin-top: 3px;">
                                {{ formattedPostedDate }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Description Card -->
                <div class="neomorphic-card-base" style="padding: 24px; border-radius: 16px;">
                    <h2 style="font-size: 16px; font-weight: 800; margin-bottom: 10px;">
                        About This Property
                    </h2>
                    <p style="font-size: 14px; line-height: 1.65; opacity: 0.85; white-space: pre-line;">
                        {{ property.description || 'Verified listing on HouseiLLA.' }}
                    </p>
                </div>

            </div>
        </div>
    </div>
</template>
