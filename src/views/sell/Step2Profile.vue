<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { advertiserService } from '../../services/advertiserService';
import { SessionKey } from '../../models/sellWizardEnums.ts';
import type { Advertiser } from '../../models/advertisement';
import { AdvertiserType, getAdvertiserTypeLabel } from '../../models/advertisementEnums';

const emit = defineEmits<{
    (e: 'profile-completed', updatedAdvertiser: Advertiser): void;
}>();

const localAdvertiser = ref<Advertiser>({
    id: 0,
    name: '',
    phone: '',
    email: '',
    address: '',
    location: 'Kolkata',
    advertiserType: AdvertiserType.INDIVIDUAL,
    contractualStatus: 0
});

const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');

onMounted(() => {
    const cachedAdvertiser = sessionStorage.getItem(SessionKey.ADVERTISER);

    if (cachedAdvertiser) {
        const d = JSON.parse(cachedAdvertiser);
        localAdvertiser.value = {
            id: d.id || 0,
            name: d.name || '',
            phone: d.phone || '',
            email: d.email || '',
            address: d.address || '',
            location: d.location || 'Kolkata',
            advertiserType: d.advertiserType ?? AdvertiserType.INDIVIDUAL,
            contractualStatus: d.contractualStatus || 0
        };
    }
});

const isNameValid = computed(() => localAdvertiser.value.name.trim().length > 0);
const isTypeValid = computed(() => localAdvertiser.value.advertiserType !== undefined && localAdvertiser.value.advertiserType !== null);

const advertiserTypeOptions = computed(() => {
    return [AdvertiserType.BROKER, AdvertiserType.BUILDER, AdvertiserType.INDIVIDUAL].map((enumValue) => ({
        value: enumValue,
        label: getAdvertiserTypeLabel(enumValue)
    }));
});

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
        const payload: Advertiser = {
            id: localAdvertiser.value.id,
            name: localAdvertiser.value.name.trim(),
            phone: localAdvertiser.value.phone,
            email: localAdvertiser.value.email,
            address: localAdvertiser.value.address.trim(),
            location: localAdvertiser.value.location,
            advertiserType: localAdvertiser.value.advertiserType,
            contractualStatus: localAdvertiser.value.contractualStatus
        };

        const data = await advertiserService.saveAdvertiserProfile(payload);

        if (data) {
            const savedEntity: Advertiser = {
                id: data.id || localAdvertiser.value.id,
                name: data.name || payload.name,
                phone: data.phone || payload.phone,
                email: data.email || payload.email,
                address: data.address || payload.address,
                location: data.location || payload.location,
                advertiserType: data.advertiserType ?? payload.advertiserType,
                contractualStatus: data.contractualStatus ?? payload.contractualStatus
            };

            emit('profile-completed', savedEntity);
        }
    } catch (error: any) {
        validationError.value = true;
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            errorMessage.value = 'Session expired or unauthorized. Please re-verify your OTP.';
        } else {
            errorMessage.value = error.response?.data?.message || 'Failed communicating with backend security layers.';
        }
    }
};
</script>


<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- 1. LOCKED VERIFIED PHONE NUMBER FIELD -->
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
                :class="{ 'is-active-node': option.value === localAdvertiser.advertiserType }">
                <input type="radio" name="advertiserTypeGroup" :value="option.value"
                    v-model="localAdvertiser.advertiserType"
                    style="position: absolute; opacity: 0; width: 0; height: 0;" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">{{ option.label }}</span>
            </label>
        </div>

        <!-- Local Validation Error Display Block -->
        <div v-if="validationError" class="filter-vertical-row" style="margin-top: 12px; margin-bottom: -4px;">
            <span class="flat-error-descriptor-text">{{ errorMessage }}</span>
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- 5. SAVE PROFILE FOOTER ACTION BUTTON -->
        <div class="flat-btn-row-wrapper">
            <button @click="handleSaveProfile" class="flat-full-width-action-btn" type="button">
                <span class="btn-text-label">
                    {{ localAdvertiser.id ? 'Update Profile Details' : 'Save Profile Details' }}
                </span>
            </button>
        </div>

    </div>
</template>
