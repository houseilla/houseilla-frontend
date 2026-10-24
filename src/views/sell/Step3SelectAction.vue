<script setup lang="ts">
import { ref, onMounted } from 'vue';

const emit = defineEmits<{
    (e: 'action-selected', payload: { mode: 'NEW' | 'EXISTING'; advertisementId: number | null; typeIndicator?: string }): void;
    (e: 'sync-step-number', step: number): void;
}>();

interface CompactAdSummary {
    id: number;
    title: string;
    price: number;
    typeIndicator: 'FLAT' | 'HOUSE';
}

const isLoading = ref<boolean>(false);
const existingAdvertisements = ref<CompactAdSummary[]>([]);

onMounted(async () => {
    emit('sync-step-number', 3);
    await fetchAdvertiserInventory();
});

const fetchAdvertiserInventory = async () => {
    isLoading.value = true;
    try {
        // Simulated network latency matching your fallback REST pipeline logic
        // Target Endpoint mapping: axios.get('/api/v1/advertisements')
        await new Promise((resolve) => setTimeout(resolve, 600));

        existingAdvertisements.value = [
            { id: 201, title: 'Luxury 3BHK Penthouse Estate', price: 8500000, typeIndicator: 'FLAT' },
            { id: 202, title: 'Salt Lake Villa Complex', price: 18000000, typeIndicator: 'HOUSE' }
        ];
    } catch (error) {
        console.error('Failed to query advertiser advertisement collection indices:', error);
    } finally {
        isLoading.value = false;
    }
};

// Route user to fresh creation pipeline
const initializeNewListingFlow = () => {
    emit('action-selected', {
        mode: 'NEW',
        advertisementId: null
    });
};

// Route user to patch pipeline for a pre-existing record fetched from H2
const initializeUpdateListingFlow = (ad: CompactAdSummary) => {
    emit('action-selected', {
        mode: 'EXISTING',
        advertisementId: ad.id,
        typeIndicator: ad.typeIndicator
    });
};
</script>
<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">
        <!-- FIXED: Header elements bind to global var token attributes directly -->
        <div class="universal-view-header-row"
            style="flex-direction: column; align-items: flex-start; margin-bottom: 12px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-color); margin: 0;">
                Select Advertisement Path
            </h3>
            <p style="font-size: 12px; color: var(--text-color); opacity: 0.5; margin: 4px 0 0 0;">
                Choose an existing listing record below to modify it, or click the blank tile to build a new one.
            </p>
        </div>

        <div v-if="isLoading" class="py-6 text-center text-xs" style="color: var(--text-color); opacity: 0.5;">
            Querying current inventory listings from H2 storage...
        </div>

        <div v-else class="ad-tiles-flex-grid">

            <!-- 1. BLANK INITIALIZATION TILE -->
            <div class="ad-action-tile blank-add-tile-modifier" @click="initializeNewListingFlow">
                <!-- FIXED: Stripped hardcoded text-blue/bg-blue rules -->
                <div class="tile-icon-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                        style="width: 18px; height: 18px;">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
                <div class="tile-content-block">
                    <span class="tile-main-heading">Create Fresh Listing</span>
                    <span class="tile-sub-caption">Publish a new property configuration</span>
                </div>
            </div>

            <!-- 2. PRE-EXISTING UPDATE TILES -->
            <div v-for="ad in existingAdvertisements" :key="ad.id" class="ad-action-tile existing-record-card-modifier"
                @click="initializeUpdateListingFlow(ad)">
                <!-- FIXED: Stripped hardcoded text-amber/bg-amber rules -->
                <div class="tile-icon-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        style="width: 16px; height: 16px;">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                    </svg>
                </div>
                <div class="tile-content-block">
                    <span class="tile-main-heading">{{ ad.title }}</span>
                    <div class="tile-meta-badge-row">
                        <span class="type-classification-tag">{{ ad.typeIndicator }}</span>
                        <span class="price-summary-tag">₹{{ (ad.price / 100000).toFixed(1) }} L</span>
                    </div>
                </div>
            </div>

        </div>
    </div>

</template>

<style scoped>
/* =====================================================================
   STEP 3 ADV MANAGEMENT SUB-DASHBOARD CONTAINER TILES
   ===================================================================== */
.ad-tiles-flex-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    width: 100%;
    padding-top: 8px;
}

.ad-action-tile {
    display: flex;
    align-items: center;
    gap: 16px;
    width: calc(50% - 8px);
    min-width: 280px;
    height: 84px;
    padding: 0 18px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    background-color: var(--bg-color);
    /* Leverages global canvas tokens natively */
    box-shadow: var(--neomorphic-flat, 0 1px 3px rgba(0, 0, 0, 0.02));
    transition: var(--transition-smooth, all 0.3s ease);
}

.blank-add-tile-modifier {
    border: 2px dashed rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .blank-add-tile-modifier {
    border: 2px dashed rgba(255, 255, 255, 0.15);
}

.blank-add-tile-modifier:hover {
    border-color: var(--accent-color);
}

.existing-record-card-modifier {
    border: 1.5px solid rgba(0, 0, 0, 0.08);
}

[data-theme="dark"] .existing-record-card-modifier {
    border: 1.5px solid rgba(255, 255, 255, 0.08);
}

.existing-record-card-modifier:hover {
    border-color: var(--accent-color);
}

.ad-action-tile:active {
    transform: scale(0.985);
}

/* --------------------------------=====================================
   AVATAR SYSTEM & ADAPTIVE VECTOR ICON OVERRIDES
   --------------------------------===================================== */
.tile-icon-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    flex-shrink: 0;
    /* FIXED: Leverages contrasting text layer metrics to stand out without box masking issues */
    background-color: var(--text-color);
    color: var(--bg-color);
    opacity: 0.9;
    transition: var(--transition-smooth);
}

.ad-action-tile:hover .tile-icon-avatar {
    background-color: var(--accent-color);
    color: #ffffff;
    opacity: 1;
}

.tile-content-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
}

.tile-main-heading {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-color);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.tile-sub-caption {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text-color);
    opacity: 0.5;
}

.tile-meta-badge-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.type-classification-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--text-color);
    border-radius: 4px;
    letter-spacing: 0.3px;
}

[data-theme="dark"] .type-classification-tag {
    background-color: rgba(255, 255, 255, 0.08);
}

.price-summary-tag {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.7;
}
</style>
