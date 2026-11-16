<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { SessionKey } from '../../models/sellWizardEnums';
import { AdvertisementPropertyType, AdvertisementPropertyTypeLabels } from '../../models/advertisementEnums';
import type {
    Advertisement,
    LandDetail,
    FlatDetail,
    HouseDetail,
    OfficeDetail,
    ShopDetail,
    WarehouseDetail
} from '../../models/advertisement';
import LandDetailsForm from './details/LandDetailsForm.vue';
import FlatDetailsForm from './details/FlatDetailsForm.vue';
import HouseDetailsForm from './details/HouseDetailsForm.vue';
import OfficeDetailsForm from './details/OfficeDetailsForm.vue';
import ShopDetailsForm from './details/ShopDetailsForm.vue';
import WarehouseDetailsForm from './details/WarehouseDetailsForm.vue';

type PropertyDetailPayload =
    | LandDetail
    | FlatDetail
    | HouseDetail
    | OfficeDetail
    | ShopDetail
    | WarehouseDetail
    | Record<string, any>;

const emit = defineEmits<{
    (e: 'details-completed', payload: PropertyDetailPayload): void;
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

const isHouseProperty = computed<boolean>(() => {
    return activePropertyType.value === AdvertisementPropertyType.HOUSE;
});

const isOfficeProperty = computed<boolean>(() => {
    return activePropertyType.value === AdvertisementPropertyType.OFFICE;
});

const isShopProperty = computed<boolean>(() => {
    return activePropertyType.value === AdvertisementPropertyType.SHOP;
});

const isWarehouseProperty = computed<boolean>(() => {
    return activePropertyType.value === AdvertisementPropertyType.WAREHOUSE;
});

const currentPropertyLabel = computed<string>(() => {
    if (activePropertyType.value === null) return 'Property';
    return AdvertisementPropertyTypeLabels[activePropertyType.value as AdvertisementPropertyType] || 'Property';
});

const handleSubFormCompleted = (savedDetails: PropertyDetailPayload) => {
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

        <!-- House Specifications Sub-View -->
        <HouseDetailsForm v-else-if="isHouseProperty" @details-completed="handleSubFormCompleted" />

        <!-- Office Specifications Sub-View -->
        <OfficeDetailsForm v-else-if="isOfficeProperty" @details-completed="handleSubFormCompleted" />

        <!-- Shop Specifications Sub-View -->
        <ShopDetailsForm v-else-if="isShopProperty" @details-completed="handleSubFormCompleted" />

        <!-- Warehouse Specifications Sub-View -->
        <WarehouseDetailsForm v-else-if="isWarehouseProperty" @details-completed="handleSubFormCompleted" />

        <!-- Fallback Guard for Unrecognized Property Type -->
        <div v-else class="raw-data-debug-row" style="text-align: center;">
            <span class="label-caption-string" style="display: block; margin-bottom: 6px;">
                {{ currentPropertyLabel }} Specifications
            </span>
            <span class="category-selection-required-prompt">
                Unsupported property type selected.
            </span>
        </div>
    </div>
</template>
