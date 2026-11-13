<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authService } from '../../services/authService';
import { SessionKey } from '../../models/sellWizardEnums.ts';
import type { OtpRequest } from '../../models/auth';
import type { Advertiser } from '../../models/advertisement';

const emit = defineEmits<{
    (e: 'auth-completed', payload: { advertiser: Advertiser; token: string }): void;
}>();

const otpStatus = ref<'IDLE' | 'SENT' | 'VERIFIED' | 'LOCKED'>('IDLE');
const failedAttempts = ref<number>(0);
const validationError = ref<boolean>(false);
const errorMessage = ref<string>('');

const authForm = ref<OtpRequest>({
    phone: '',
    email: '',
    otpCode: ''
});

// --- Dynamic Lock Engine Key Hash Helper ---
const generateUserLockKey = () => {
    const cleanedPhone = authForm.value.phone.trim();
    const cleanedEmail = authForm.value.email.trim().toLowerCase();
    return `auth_lock_${cleanedPhone}_${btoa(cleanedEmail).replace(/=/g, '')}`;
};

// --- Check and Enforce Persistent Brute Force Controls ---
const checkLockConstraints = (): boolean => {
    const lockKey = generateUserLockKey();
    const cachedLockData = localStorage.getItem(lockKey);

    if (cachedLockData) {
        const lockDetails = JSON.parse(cachedLockData);
        const activeTimeRemaining = lockDetails.lockUntil - Date.now();

        if (activeTimeRemaining > 0) {
            otpStatus.value = 'LOCKED';
            validationError.value = true;
            const hoursRemaining = Math.ceil(activeTimeRemaining / (1000 * 60 * 60));
            errorMessage.value = `Too many incorrect attempts. This profile remains locked for the next ${hoursRemaining} hours.`;
            return true;
        } else {
            localStorage.removeItem(lockKey);
        }
    }
    return false;
};

onMounted(() => {
    const isOtpVerified = sessionStorage.getItem(SessionKey.OTP_VERIFIED) === 'true';
    const cachedAdvertiser = sessionStorage.getItem(SessionKey.ADVERTISER);

    if (isOtpVerified && cachedAdvertiser) {
        const d = JSON.parse(cachedAdvertiser);
        authForm.value.phone = d.phone || '';
        authForm.value.email = d.email || '';
        otpStatus.value = 'VERIFIED';
    }
});

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

    if (checkLockConstraints()) return;

    try {
        const data = await authService.sendOtp(authForm.value);
        if (data.success) {
            failedAttempts.value = 0;
            otpStatus.value = 'SENT';
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

    if (checkLockConstraints()) return;

    try {
        const data = await authService.verifyOtp(authForm.value);

        if (data.success) {
            otpStatus.value = 'VERIFIED';
            failedAttempts.value = 0;
            localStorage.removeItem(generateUserLockKey());

            const synchronizedAdvertiserPayload: Advertiser = {
                id: data.isProfileExisting && data.advertiser ? data.advertiser.id : 0,
                name: data.isProfileExisting && data.advertiser ? data.advertiser.name : '',
                phone: authForm.value.phone.trim(),
                email: authForm.value.email.trim(),
                address: data.isProfileExisting && data.advertiser ? data.advertiser.address : '',
                location: data.isProfileExisting && data.advertiser ? data.advertiser.location : 'Kolkata',
                advertiserType: data.isProfileExisting && data.advertiser ? data.advertiser.advertiserType : 0,
                contractualStatus: data.isProfileExisting && data.advertiser ? data.advertiser.contractualStatus : 0
            };

            emit('auth-completed', {
                advertiser: synchronizedAdvertiserPayload,
                token: data.jwtToken || ''
            });
        }
    } catch (error: any) {
        validationError.value = true;

        if (error.response && error.response.status === 401) {
            failedAttempts.value++;
            const lockKey = generateUserLockKey();

            if (failedAttempts.value >= 3) {
                otpStatus.value = 'LOCKED';
                const lockTimeExpiry = Date.now() + (24 * 60 * 60 * 1000);
                localStorage.setItem(lockKey, JSON.stringify({ lockUntil: lockTimeExpiry }));
                errorMessage.value = 'Too many incorrect attempts. This profile has been locked for 24 hours.';
            } else {
                const serverMessage = error.response.data?.message || 'The verification code entered is incorrect.';
                errorMessage.value = `${serverMessage} ${3 - failedAttempts.value} attempts remaining.`;
            }
        } else {
            errorMessage.value = 'Failed to process verification code validation.';
        }
    }
};
</script>



<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">
        <!-- Phone Field -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isPhoneValid() }">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <input type="tel" class="flat-raw-input" placeholder="Enter Phone Number..." v-model="authForm.phone"
                maxlength="10" @input="authForm.phone = authForm.phone.replace(/\D/g, '')"
                :disabled="otpStatus !== 'IDLE'" />
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Email Field -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isEmailValid() }">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
            <input type="email" class="flat-raw-input" placeholder="Enter Email Address..." v-model="authForm.email"
                @input="authForm.email = authForm.email.trim().toLowerCase()" :disabled="otpStatus !== 'IDLE'" />
        </div>

        <!-- System Messaging Alert Box -->
        <div v-if="validationError" class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>
        <div v-if="validationError" class="filter-vertical-row">
            <span class="flat-error-descriptor-text">{{ errorMessage }}</span>
        </div>

        <!-- Success Message Row -->
        <div v-if="otpStatus === 'VERIFIED'" class="filter-vertical-row animate-fade-in remove-bottom-gap"
            style="margin-top: 12px; display: flex; align-items: center; gap: 8px;">
            <svg class="success-tick-icon" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="3.5"
                stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; flex-shrink: 0;">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span class="label-caption-string" style="color: #2ecc71;">OTP validation successful!</span>
        </div>

        <!-- OTP Input Code Box -->
        <div v-if="otpStatus === 'SENT'" class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>
        <div v-if="otpStatus === 'SENT'" class="otp-input-reveal-wrapper">
            <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isOtpValid() }">
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input type="text" class="flat-raw-input" placeholder="Enter 6-Digit OTP..." v-model="authForm.otpCode"
                    maxlength="6" @input="authForm.otpCode = authForm.otpCode.replace(/\D/g, '')" />
            </div>
        </div>

        <!-- Interface Trigger Buttons (Completely hidden when step status is LOCKED or VERIFIED) -->
        <div v-if="otpStatus === 'IDLE' || otpStatus === 'SENT'" class="flat-btn-row-wrapper" style="margin-top: 16px;">
            <button @click="otpStatus === 'SENT' ? confirmOtpVerification() : verifyAdvertiser()"
                class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span class="btn-text-label">
                    {{ otpStatus === 'SENT' ? 'Verify OTP Code' : 'Identify Advertiser' }}
                </span>
            </button>
        </div>
    </div>
</template>
