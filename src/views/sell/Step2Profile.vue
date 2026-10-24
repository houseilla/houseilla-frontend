<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { advertiserService } from '../../services/advertiserService';
import type { Advertiser } from '../../models/advertisement';
import { AdvertiserType, AdvertiserTypeLabels, getAdvertiserTypeLabel } from '../../models/enums';

// 1. Establish the explicit props and emit interface channels matching our layout framework contract
const props = defineProps<{
    advertiserData: Advertiser | null;
}>();

const emit = defineEmits<{
    (e: 'profile-completed', updatedAdvertiser: Advertiser): void;
}>();

// Local active working state references
const localAdvertiser = ref<Advertiser>({
    advertiserId: 0,
    name: '',
    phone: '',
    email: '',
    address: '',
    location: 'Kolkata',
    type: AdvertiserType.INDIVIDUAL,
    contractual: 0
});

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');

// Sync incoming database object values down to our isolated local memory clone on boot
onMounted(() => {
    if (props.advertiserData) {
        localAdvertiser.value = {
            ...props.advertiserData,
            // Default to Kolkata matching our location constraints if none is configured
            location: props.advertiserData.location || 'Kolkata'
        };
    }
});

// Structural validator computational rules
const isNameValid = computed(() => localAdvertiser.value.name.trim().length > 0);
const isTypeValid = computed(() => localAdvertiser.value.type !== undefined && localAdvertiser.value.type !== null);

// Generate list keys safely mapping through our numeric enum wrappers (0, 1, 2)
const advertiserTypeOptions = computed(() => {
    return [AdvertiserType.BROKER, AdvertiserType.BUILDER, AdvertiserType.INDIVIDUAL].map((enumValue) => ({
        value: enumValue,
        label: getAdvertiserTypeLabel(enumValue)
    }));
});

// Dispatch the compiled model updates safely to our JPA persistence hook layer
const handleSaveProfile = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!isNameValid.value) {
        validationError.value = true;
        errorMessage.value = 'Please enter your full name to complete your profile.';
        return;
    }

    if (!isTypeValid.value) {
        validationError.value = true;
        errorMessage.value = 'Please select your advertiser account profile type.';
        return;
    }

    try {
        const response = await advertiserService.saveAdvertiserProfile(localAdvertiser.value);

        if (response.success && response.advertiser) {
            console.log('Profile processed and saved down to database successfully!', response.advertiser);
            // Emit the pristine database-committed entity snapshot back to our shell context frame
            emit('profile-completed', response.advertiser);
        } else {
            validationError.value = true;
            errorMessage.value = response.message || 'Failed to submit profile updates. Please try again.';
        }
    } catch (error) {
        validationError.value = true;
        errorMessage.value = 'Failed communicating with backend security layers.';
        console.error('API profile transaction faulted:', error);
    }
};
</script>
<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- 1. LOCKED VERIFIED PHONE NUMBER FIELD ON TOP -->
        <div class="flat-form-field">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <input type="tel" class="flat-raw-input" v-model="localAdvertiser.phone" disabled />
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- 2. LOCKED VERIFIED EMAIL ADDRESS FIELD -->
        <div class="flat-form-field">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
            <input type="email" class="flat-raw-input" v-model="localAdvertiser.email" disabled />
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- 3. EDITABLE FULL NAME INPUT FIELD -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isNameValid }">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
            <input type="text" class="flat-raw-input" placeholder="Enter Full Name..." v-model="localAdvertiser.name" />
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- 4. EDITABLE ADVERTISER TYPE RADIO SELECTION BLOCK -->
        <div class="borderless-flat-radio-row" :class="{ 'is-invalid-field': validationError && !isTypeValid }">
            <label v-for="option in advertiserTypeOptions" :key="option.value" class="flat-radio-label-node"
                :class="{ 'is-active-node': option.value === localAdvertiser.type }">
                <input type="radio" name="advertiserTypeGroup" :value="option.value" v-model="localAdvertiser.type"
                    style="position: absolute; opacity: 0; width: 0; height: 0;" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">{{ option.label }}</span>
            </label>
        </div>

        <!-- Local Validation Error Display Block -->
        <div v-if="validationError" class="filter-vertical-row" style="margin-top: 12px; margin-bottom: -4px;">
            <span class="flat-error-descriptor-text">
                {{ errorMessage }}
            </span>
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- 5. SAVE PROFILE FOOTER ACTION BUTTON -->
        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveProfile" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                </svg>
                <span class="btn-text-label">
                    {{ localAdvertiser.advertiserId ? 'Update Profile Details' : 'Save Profile Details' }}
                </span>
            </button>
        </div>

    </div>
</template>
<style scoped></style>
