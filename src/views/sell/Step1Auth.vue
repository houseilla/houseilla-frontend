<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authService } from '../../services/authService';
import type { OtpRequest } from '../../models/auth';

const emit = defineEmits<{
    (e: 'auth-completed', payload: { advertiser: any; nextStep: number }): void;
}>();

const isOtpSent = ref<boolean>(false);
const isOtpVerified = ref<boolean>(false);
const isOtpSuccess = ref<boolean>(false);
const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');

const authForm = ref<OtpRequest>({
    phone: '',
    email: '',
    otpCode: ''
});

// 1. STATE RESTORE HOOK: Fires automatically whenever Step 1 loads into view
onMounted(() => {
    // Check if an advertiser context wrapper is already verified from a previous step hit
    const existingAdvertiserCache = sessionStorage.getItem('authenticatedAdvertiser');
    const wizardFormInputsCache = sessionStorage.getItem('houseilla_step1_inputs');

    if (wizardFormInputsCache) {
        const savedInputs = JSON.parse(wizardFormInputsCache);
        authForm.value.phone = savedInputs.phone || '';
        authForm.value.email = savedInputs.email || '';
    }

    if (existingAdvertiserCache) {
        // If an active session string token exists, the user is already authenticated!
        // Instantly lock up fields and apply the success visual state checklist triggers
        isOtpSent.value = true;
        isOtpVerified.value = true;
        isOtpSuccess.value = true;
    }
});

// 2. CACHE DISPATCH SYNCRONIZER: Saves intermediate character string states on input focus changes
const syncFormInputsToCache = () => {
    const inputSnapshot = {
        phone: authForm.value.phone.trim(),
        email: authForm.value.email.trim()
    };
    sessionStorage.setItem('houseilla_step1_inputs', JSON.stringify(inputSnapshot));
};

const isPhoneValid = () => /^\d{10}$/.test(authForm.value.phone.trim());
const isEmailValid = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.value.email.trim());
const isOtpValid = () => /^\d{6}$/.test(authForm.value.otpCode.trim());

const verifyAdvertiser = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!isPhoneValid() || !isEmailValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid phone number and formatted email address.';
        return;
    }

    // Sync state values before hitting backend routing filters
    syncFormInputsToCache();

    try {
        const data = await authService.sendOtp(authForm.value);
        if (data.success) {
            isOtpSent.value = true;
        } else {
            validationError.value = true;
            errorMessage.value = data.message || 'Failed to send OTP. Please try again.';
        }
    } catch (error) {
        validationError.value = true;
        errorMessage.value = 'Cannot connect to backend authentication server.';
    }
};

const confirmOtpVerification = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!isOtpValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid 6-digit numeric OTP.';
        return;
    }

    try {
        const data = await authService.verifyOtp(authForm.value);

        if (data.success) {
            isOtpVerified.value = true;
            isOtpSuccess.value = true;

            // Cleanly refresh matching baseline properties inside text storage cache blocks
            syncFormInputsToCache();

            let unifiedAdvertiserPayload: any;
            if (data.isProfileExisting && data.advertiser) {
                unifiedAdvertiserPayload = data.advertiser;
            } else {
                unifiedAdvertiserPayload = {
                    advertiserId: 0,
                    name: '',
                    phone: authForm.value.phone.trim(),
                    email: authForm.value.email.trim(),
                    address: '',
                    location: '',
                    type: undefined,
                    contractual: false
                };
            }

            // Explicitly commit verified advertiser context profile block down to session engine maps
            sessionStorage.setItem('authenticatedAdvertiser', JSON.stringify(unifiedAdvertiserPayload));

            setTimeout(() => {
                emit('auth-completed', {
                    advertiser: unifiedAdvertiserPayload,
                    nextStep: 2
                });
            }, 600);

        } else {
            validationError.value = true;
            errorMessage.value = data.message || 'The verification code entered is incorrect.';
        }
    } catch (error) {
        validationError.value = true;
        errorMessage.value = 'Failed to process verification code validation.';
    }
};
</script>


<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- Phone Number Input Field Wrapper -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isPhoneValid() }">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <!-- CORES LOCK RULE: Keeps field uneditable once OTP check passes -->
            <input type="tel" class="flat-raw-input" placeholder="Enter Phone Number..." v-model="authForm.phone"
                maxlength="10" @input="authForm.phone = authForm.phone.replace(/\D/g, ''); syncFormInputsToCache();"
                :disabled="isOtpSent || isOtpVerified" />

        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Email Address Input Field Wrapper -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isEmailValid() }">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
            <!-- CORES LOCK RULE: Keeps field uneditable once OTP check passes -->
            <input type="email" class="flat-raw-input" placeholder="Enter Email Address..." v-model="authForm.email"
                @input="authForm.email = authForm.email.trim().toLowerCase(); syncFormInputsToCache();"
                :disabled="isOtpSent || isOtpVerified" />

        </div>

        <!-- Validation Error Placement at Bottom -->
        <div v-if="validationError" class="filter-vertical-row">
            <span class="flat-error-descriptor-text">
                {{ errorMessage }}
            </span>
        </div>

        <!-- SUCCESS PLACEHOLDER BANNER: Appears when verification completes -->
        <div v-if="isOtpSuccess" class="filter-vertical-row animation-fade-in-smooth"
            style="margin-top: 12px; margin-bottom: 4px;">
            <div class="flat-success-banner-card">
                <svg class="success-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span class="flat-success-descriptor-text">
                    OTP verified successfully!
                </span>
            </div>
        </div>

        <div v-else class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Verification OTP Input Section (Hides cleanly once verified) -->
        <div v-if="isOtpSent && !isOtpVerified" class="otp-input-reveal-wrapper">
            <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isOtpValid() }">
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input type="text" class="flat-raw-input" placeholder="Enter 6-Digit OTP..." v-model="authForm.otpCode"
                    maxlength="6" @input="authForm.otpCode = authForm.otpCode.replace(/\D/g, '')" />
            </div>
        </div>

        <div v-if="isOtpSent && !isOtpVerified" class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- ACTION TRIGGER ZONE: Button container collapses out of view when verified -->
        <div v-if="!isOtpVerified" class="flat-btn-row-wrapper">
            <button @click="isOtpSent ? confirmOtpVerification() : verifyAdvertiser()"
                class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span class="btn-text-label">
                    {{ isOtpSent ? 'Identify Advertiser' : 'Verify OTP Code' }}
                </span>
            </button>
        </div>

    </div>
</template>
<style scoped>
/* Local dynamic transition animations unique to Step 1 */
.animation-fade-in-smooth {
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(2px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Local block mapping unique to the OTP reveal engine */
.otp-input-reveal-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
}
</style>
