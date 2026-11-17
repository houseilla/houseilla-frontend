<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { SessionKey } from '../../../../models/sellWizardEnums';
import { advertisementService } from '../../../../services/advertisementService';
import type { Advertisement } from '../../../../models/advertisement';
import {
    AdvertisementPropertyType,
    AdvertisementPurpose,
    AdvertisementStatus,
    getPropertyTypeLabel,
    AdvertisementPurposeLabels,
    getAdvertisementStatusLabel
} from '../../../../models/advertisementEnums';

const emit = defineEmits<{
    (e: 'action-selected', payload: { mode: 'NEW' | 'EXISTING'; advertisement: Advertisement | null }): void;
}>();

const selectedOperation = ref<'NEW' | 'EXISTING' | null>(null);
const selectedAdvertisementId = ref<number | null>(null);
const existingListings = ref<Advertisement[]>([]);
const isLoading = ref<boolean>(false);
const fetchError = ref<string>('');

const normalizePropertyType = (val: unknown): AdvertisementPropertyType => {
    if (typeof val === 'number') return val as AdvertisementPropertyType;
    if (typeof val === 'string' && val in AdvertisementPropertyType) {
        return AdvertisementPropertyType[val as keyof typeof AdvertisementPropertyType];
    }
    return AdvertisementPropertyType.FLAT;
};

const normalizePurpose = (val: unknown): AdvertisementPurpose => {
    if (typeof val === 'number') return val as AdvertisementPurpose;
    if (typeof val === 'string' && val in AdvertisementPurpose) {
        return AdvertisementPurpose[val as keyof typeof AdvertisementPurpose];
    }
    return AdvertisementPurpose.SALE;
};

const normalizeStatus = (val: unknown): AdvertisementStatus => {
    if (typeof val === 'number') return val as AdvertisementStatus;
    if (typeof val === 'string' && val in AdvertisementStatus) {
        return AdvertisementStatus[val as keyof typeof AdvertisementStatus];
    }
    return AdvertisementStatus.DRAFT;
};

const normalizeAdvertisement = (raw: any): Advertisement => ({
    ...raw,
    propertyType: normalizePropertyType(raw.propertyType),
    purpose: normalizePurpose(raw.purpose),
    listingStatus: normalizeStatus(raw.listingStatus),
    price: Number(raw.price) || 0,
    latitude: raw.latitude !== null && raw.latitude !== undefined ? Number(raw.latitude) : undefined,
    longitude: raw.longitude !== null && raw.longitude !== undefined ? Number(raw.longitude) : undefined
});

onMounted(async () => {
    const savedOperation = sessionStorage.getItem(SessionKey.ADVERTISEMENT_OPERATION);
    if (savedOperation === 'NEW' || savedOperation === 'EXISTING') {
        selectedOperation.value = savedOperation;
    }

    const cachedAd = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    if (cachedAd) {
        const parsedAd = JSON.parse(cachedAd);
        if (parsedAd?.id) {
            selectedAdvertisementId.value = parsedAd.id;
        }
    }

    const cachedAdvertiser = sessionStorage.getItem(SessionKey.ADVERTISER);
    if (cachedAdvertiser) {
        const advertiser = JSON.parse(cachedAdvertiser);
        if (advertiser?.id) {
            isLoading.value = true;
            fetchError.value = '';
            try {
                const rawListings = await advertisementService.getAdvertisementsByAdvertiser(advertiser.id);
                existingListings.value = (rawListings || []).map(normalizeAdvertisement);
            } catch (err) {
                fetchError.value = 'Could not load your existing listings. You can still create a new listing below.';
            } finally {
                isLoading.value = false;
            }
        }
    }
});

const handleCreateNewListing = () => {
    selectedOperation.value = 'NEW';
    selectedAdvertisementId.value = null;
    emit('action-selected', {
        mode: 'NEW',
        advertisement: null
    });
};

const handleSelectExistingListing = (ad: Advertisement) => {
    selectedOperation.value = 'EXISTING';
    selectedAdvertisementId.value = ad.id;
    emit('action-selected', {
        mode: 'EXISTING',
        advertisement: ad
    });
};

const handleDeleteListing = async (ad: Advertisement) => {
    const confirmed = window.confirm(`Delete "${getPropertyTypeLabel(ad.propertyType)} ${AdvertisementPurposeLabels[ad.purpose] || ''}" (#${ad.id})?`);
    if (!confirmed) return;

    try {
        if (typeof (advertisementService as any).deleteAdvertisement === 'function') {
            await (advertisementService as any).deleteAdvertisement(ad.id);
        }
        existingListings.value = existingListings.value.filter((item) => item.id !== ad.id);
        if (selectedAdvertisementId.value === ad.id) {
            selectedAdvertisementId.value = null;
            selectedOperation.value = null;
            sessionStorage.removeItem(SessionKey.ADVERTISEMENT);
        }
    } catch (err) {
        fetchError.value = 'Failed to delete advertisement. Please try again.';
    }
};


const formatPrice = (price: number): string => {
    if (!price || price <= 0) return 'Price not set';
    return `₹ ${price.toLocaleString('en-IN')}`;
};

const formatPrimaryAddress = (ad: Advertisement): string => {
    return [ad.propertyNumber, ad.areaName].filter(Boolean).join(', ') || 'Address pending';
};

const formatDistrictPincode = (ad: Advertisement): string => {
    return [ad.district, ad.pincode].filter(Boolean).join(' - ');
};
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone animate-fade-in">

        <div class="universal-view-header-row"
            style="flex-direction: column; align-items: flex-start; margin-bottom: 12px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-color); margin: 0;">
                Select Advertisement Path
            </h3>
            <p style="font-size: 12px; color: var(--text-color); opacity: 0.5; margin: 4px 0 0 0;">
                Start a fresh listing or select an existing property card below to update its details.
            </p>
        </div>

        <!-- ERROR FEEDBACK -->
        <div v-if="fetchError" class="flat-error-descriptor-text">
            {{ fetchError }}
        </div>

        <!-- 3-COLUMN METADATA CARD GRID -->
        <div class="tiles-three-col-grid" style="padding-top: 8px;">

            <!-- TILE 1: CREATE FRESH LISTING -->
            <div class="shared-grid-tile is-dashed-add-tile step3-card-dims"
                :class="{ 'is-active-tile': selectedOperation === 'NEW' }" @click="handleCreateNewListing">
                <div class="tile-center-stack">
                    <div class="tile-icon-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                            style="width: 18px; height: 18px;">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                    <span class="tile-main-heading">Create Fresh Listing</span>
                    <span class="tile-sub-caption">Publish a new property</span>
                </div>
            </div>

            <!-- LOADING SKELETON CARD -->
            <div v-if="isLoading" class="shared-grid-tile is-loading-tile step3-card-dims">
                <span class="tile-sub-caption">Loading existing listings...</span>
            </div>

            <!-- TILES 2..N: EXISTING PROPERTY CARDS -->
            <div v-else v-for="ad in existingListings" :key="ad.id"
                class="shared-grid-tile is-solid-item-tile step3-card-dims"
                :class="{ 'is-active-tile': selectedOperation === 'EXISTING' && selectedAdvertisementId === ad.id }"
                @click="handleSelectExistingListing(ad)">

                <div class="card-top-row">
                    <div class="tile-icon-avatar small-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                            style="width: 14px; height: 14px;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>

                    <button type="button" class="card-delete-icon-btn" title="Delete Advertisement"
                        @click.stop="handleDeleteListing(ad)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                            stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                            <path d="M10 11v6"></path>
                            <path d="M14 11v6"></path>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                        </svg>
                    </button>
                </div>

                <div class="card-body-block">
                    <span class="tile-main-heading line-clamp-1">
                        {{ getPropertyTypeLabel(ad.propertyType) }} {{ AdvertisementPurposeLabels[ad.purpose] || '' }}
                    </span>
                    <span class="tile-sub-caption line-clamp-1">
                        {{ formatPrimaryAddress(ad) }}
                    </span>
                    <span v-if="formatDistrictPincode(ad)" class="tile-sub-caption district-pincode-line line-clamp-1">
                        {{ formatDistrictPincode(ad) }}
                    </span>
                </div>

                <div class="card-footer-row">
                    <span class="card-price-tag">{{ formatPrice(ad.price) }}</span>
                    <span class="ad-status-pill" :class="`status-code-${ad.listingStatus}`">
                        {{ getAdvertisementStatusLabel(ad.listingStatus) }}
                    </span>
                </div>
            </div>

        </div>

    </div>
</template>

<style scoped>
.step3-card-dims {
    min-height: 158px;
    padding: 14px;
}

.card-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.card-body-block {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 10px 0;
}

.district-pincode-line {
    font-weight: 600;
    opacity: 0.65;
}

.card-footer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

[data-theme="dark"] .card-footer-row {
    border-top-color: rgba(255, 255, 255, 0.07);
}

.card-price-tag {
    font-size: 12.5px;
    font-weight: 700;
    color: var(--accent-color);
}

.ad-status-pill {
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.06);
    color: var(--text-color);
}

.status-code-0 {
    background-color: rgba(234, 88, 12, 0.12);
    color: #ea580c;
}

.status-code-1 {
    background-color: rgba(46, 204, 113, 0.14);
    color: #2ecc71;
}
</style>
