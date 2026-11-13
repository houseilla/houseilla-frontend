<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { SessionKey } from '../../models/sellWizardEnums';
import { AdvertisementPropertyType, AdvertisementPropertyTypeLabels } from '../../models/advertisementEnums';
import type { Advertisement, LandDetail, FlatDetail } from '../../models/advertisement';
import LandDetailsForm from './details/LandDetailsForm.vue';
import FlatDetailsForm from './details/FlatDetailsForm.vue';

const emit = defineEmits<{
    (e: 'details-completed', payload: LandDetail | FlatDetail | Record<string, any>): void;
}>();

const activeAdvertisement = ref<Advertisement | null>(null);

onMounted(() => {
    const cachedAd = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    if (cachedAd) {
        activeAdvertisement.value = JSON.parse(cachedAd);
    }
});

const activePropertyType = computed<number | null>(() => {
    if (!activeAdvertisement.value || activeAdvertisement.value.propertyType === undefined) {
        return null;
    }
    return Number(activeAdvertisement.value.propertyType);
});

const isLandProperty = computed<boolean>(() => {
    return (
        activePropertyType.value === AdvertisementPropertyType.PRIVATE_LAND ||
        activePropertyType.value === AdvertisementPropertyType.COMMERCIAL_LAND
    );
});

const isFlatProperty = computed<boolean>(() => {
    return activePropertyType.value === AdvertisementPropertyType.FLAT;
});

const currentPropertyLabel = computed<string>(() => {
    if (activePropertyType.value === null) return 'Property';
    return AdvertisementPropertyTypeLabels[activePropertyType.value as AdvertisementPropertyType] || 'Property';
});

const handleSubFormCompleted = (savedDetails: LandDetail | FlatDetail | Record<string, any>) => {
    emit('details-completed', savedDetails);
};
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone animate-fade-in">
        <!-- Guard: Missing Step 5 Advertisement Context -->
        <div v-if="!activeAdvertisement || !activeAdvertisement.id" class="filter-vertical-row">
            <span class="flat-error-descriptor-text">
                Missing advertisement context. Please complete Step 5 (Property Type & Purpose) first.
            </span>
        </div>

        <!-- Land Specifications Sub-View (Private Land & Commercial Land) -->
        <LandDetailsForm v-else-if="isLandProperty" @details-completed="handleSubFormCompleted" />

        <!-- Flat Specifications Sub-View -->
        <FlatDetailsForm v-else-if="isFlatProperty" @details-completed="handleSubFormCompleted" />

        <!-- Placeholder for Upcoming Property Types (House, Office, Shop, Warehouse) -->
        <div v-else class="raw-data-debug-row" style="text-align: center;">
            <span class="label-caption-string" style="display: block; margin-bottom: 6px;">
                {{ currentPropertyLabel }} Specifications
            </span>
            <span class="category-selection-required-prompt">
                Sub-form component for this property type is next in queue.
            </span>
        </div>
    </div>
</template>
