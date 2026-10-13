<script setup lang="ts">
import { ref } from 'vue';
import { authService } from '../services/authService';
import type { OtpRequest } from '../models/auth';
import type { Advertiser } from '../models/advertisement';

// 1. UI tracks only the flat authentication fields during Phase 1
const authForm = ref<OtpRequest>({
    phone: '',
    email: '',
    otpCode: ''
});

// 2. Active domain model entity initialized as null until account verification checks pass
const authenticatedAdvertiser = ref<Advertiser | null>(null);

const isOtpSent = ref(false);
const validationError = ref(false);
const errorMessage = ref('');

const isPhoneValid = () => authForm.value.phone.trim().length > 0;

const isEmailValid = () => {
    const cleanEmail = authForm.value.email.trim();
    if (!cleanEmail) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleanEmail);
};

const isOtpValid = () => {
    const cleanOtp = authForm.value.otpCode.trim();
    return cleanOtp.length === 6 && /^\d+$/.test(cleanOtp);
};

// Dispatch Step Handler
const verifyAdvertiser = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!isPhoneValid() && !isEmailValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter your phone number and email address to proceed.';
        return;
    }

    if (!isPhoneValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid phone number.';
        return;
    }

    if (!isEmailValid()) {
        validationError.value = true;
        errorMessage.value = 'The formatting configuration of the email address is invalid.';
        return;
    }

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
        console.error('Fetch error:', error);
    }
};

// Verification and Hand-off Step Handler
const confirmOtpVerification = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!authForm.value.otpCode.trim()) {
        validationError.value = true;
        errorMessage.value = 'Please enter the verification code sent to your email.';
        return;
    }

    if (!isOtpValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid 6-digit numeric OTP.';
        return;
    }

    try {
        const response = await authService.verifyOtp(authForm.value);

        if (response.success) {
            console.log('OTP Session Check Passed!');

            // Phase 2: Post-Verification Graduation
            // Initiate your pre-built advertiser object schema here
            authenticatedAdvertiser.value = {
                advertiserId: response.advertiser?.advertiserId || 0,
                advertiserName: response.advertiser?.advertiserName || '',
                isPremium: response.advertiser?.isPremium || 0,
                advertiserType: response.advertiser?.advertiserType || 0,
                // Hand off and map the verified details securely into your Advertiser instance
                advertiserPhone: authForm.value.phone.trim(),
                advertiserEmail: authForm.value.email.trim()
            };

            console.log('Advertiser Profile Successfully Initialized:', authenticatedAdvertiser.value);

            // Proceed to the next step of the property listing form
        } else {
            validationError.value = true;
            errorMessage.value = response.message || 'The verification code entered is incorrect or has expired.';
        }
    } catch (error) {
        validationError.value = true;
        errorMessage.value = 'Failed to process verification code validation.';
        console.error('Fetch error:', error);
    }
};
</script>



<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- Phone Number Field Section -->
        <div class="filter-vertical-row">
            <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isPhoneValid() }">
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path
                        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input ref="phoneInputRef" type="tel" class="flat-raw-input" placeholder="Enter Phone Number..."
                    v-model="authForm.phone" :disabled="isOtpSent" />
            </div>
        </div>

        <!-- Divider Line 1 -->
        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Email Field Section -->
        <div class="filter-vertical-row">
            <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isEmailValid() }">
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
                <input ref="emailInputRef" type="email" class="flat-raw-input" placeholder="email@domain.com"
                    v-model="authForm.email" :disabled="isOtpSent" />
            </div>
        </div>

        <!-- Validation Error Placement at Bottom -->
        <div v-if="validationError" class="filter-vertical-row">
            <span class="flat-error-descriptor-text">
                {{ errorMessage }}
            </span>
        </div>

        <div v-else class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Step 2 Dynamic Reveal: OTP Code Input Section -->

        <div v-if="isOtpSent" class="filter-vertical-row otp-verification-wrapper">
            <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isOtpValid() }">
                <!-- Security Shield/Key Icon for OTP Box -->
                <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input type="text" class="flat-raw-input" placeholder="Enter 6-Digit OTP..." v-model="authForm.otpCode"
                    maxlength="6" />
            </div>
        </div>

        <div v-if="isOtpSent" class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- Action Trigger Section Switcher -->
        <div class="filter-vertical-row">
            <div class="flat-btn-row-wrapper">
                <!-- Render OTP Verify button if sent, otherwise standard Identify step button -->
                <button @click="isOtpSent ? confirmOtpVerification() : verifyAdvertiser()"
                    class="flat-full-width-action-btn" type="button">
                    <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <span class="btn-text-label">
                        {{ isOtpSent ? 'Verify OTP Code' : 'Identify Advertiser' }}
                    </span>
                </button>
            </div>
        </div>

    </div>
</template>

<style scoped>
/* Scoped configurations matching BuyPropertyView configuration hooks */
.otp-verification-wrapper {
    width: 100%;
}
</style>
