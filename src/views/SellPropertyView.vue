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

// Active step metrics pointer state trackers
const currentStep = ref(1);
const maxVisitedStep = ref(1); // Graduation index constraint block

const getStepLabel = (stepIndex: number): string => {
    const stepsMap: Record<number, string> = {
        1: 'Advertiser Identification',
        2: 'Advertiser Profile',
        3: 'Add/Update Advertisements',
        4: 'Property Location',
        5: 'Property Type & Purpose',
        6: 'Property Details',
        7: 'Photos & Media'
    };
    return stepsMap[stepIndex] || 'Unknown Step';
};

const navigateToStep = (targetStep: number) => {
    if (targetStep <= maxVisitedStep.value) {
        currentStep.value = targetStep;
        validationError.value = false;
    } else {
        // Safety Fallback: revert layout select index choice if user tries to skip forward illegally
        currentStep.value = maxVisitedStep.value;
    }
};

</script>

<template>
    <div class="horizontal-steps-nav">

        <!-- TRANSPARENT SELECT ENGINE ZONE -->
        <div class="step-select-wrapper">
            <select class="custom-transparent-step-select" v-model="currentStep"
                @change="navigateToStep(Number(currentStep))">
                <option v-for="stepNum in 7" :key="stepNum" :value="stepNum" :disabled="stepNum > maxVisitedStep"
                    :class="{
                        'opt-step-active': currentStep === stepNum,
                        'opt-step-accessible': stepNum <= maxVisitedStep && currentStep !== stepNum,
                        'opt-step-locked': stepNum > maxVisitedStep
                    }">
                    <!-- Dynamic text switcher: when rendering the dropdown list options, show names. When closed, shows only step index -->
                    {{ currentStep === stepNum ? `Step ${stepNum} of 7` : `Step ${stepNum} of 7:
                    ${getStepLabel(stepNum)}` }}
                </option>
            </select>

            <!-- Native Inline Blue SVG Dropdown Arrow Icon -->
            <svg class="custom-native-dropdown-arrow-svg" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="#0076df" stroke-width="3" stroke-linecap="round"
                    stroke-linejoin='round' />
            </svg>
        </div>

        <span class="step-separator-vertical-pipe">|</span>

        <!-- CURRENT ACTIVE STEP DISPLAY (FLAT TEXT VIEW) -->
        <div class="step-nav-textitem active-view-status">
            <span class="universal-status-dot dot-brand-blue"></span>
            <span class="step-label-text-string">{{ getStepLabel(currentStep) }}</span>
        </div>

        <span class="step-separator-arrow">➔</span>

        <!-- UPCOMING PREVIEW DISPLAYER (FLAT TEXT VIEW) -->
        <div class="step-nav-textitem upcoming-preview-status">
            <span class="universal-status-dot dot-brand-orange" :class="{ 'dot-brand-muted': currentStep < 2 }"></span>
            <span class="step-label-text-string text-muted">
                Next: {{ currentStep < 7 ? getStepLabel(currentStep + 1) : 'Review & Submit' }} </span>
        </div>
    </div>

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

/* Container for horizontal compact progress bar placement */
.horizontal-steps-nav {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 12px;
    margin-bottom: 24px;
    background-color: transparent;
}

/* Symmetrical dynamic layout counters */
.step-progress-counter-badge {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    white-space: nowrap;
}

.active-count-num {
    font-size: 15px;
    font-weight: 600;
    color: #0076df;
    /* Brand Accent Blue */
}

.total-count-num {
    font-size: 13px;
    color: #64748b;
}

.step-separator-vertical-pipe {
    color: #cbd5e1;
    opacity: 0.7;
    user-select: none;
}

/* Base item wrapper controls */
.step-nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}

.step-active {
    font-weight: 500;
}

.step-upcoming-preview {
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.step-label-text {
    font-size: 14px;
    color: #1e293b;
}

.step-separator-arrow {
    color: #cbd5e1;
    font-size: 11px;
    user-select: none;
}

/* Geometric dot nodes */
/*
.dot-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
}

.blue-dot {
    background-color: #0076df;
}

.orange-dot {
    background-color: #ff7b00;
}

.dot-muted {
    background-color: #cbd5e1 !important;
}
*/
.text-muted {
    color: #64748b !important;
}

/* Central horizontal steps bar alignment container */
.horizontal-steps-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 24px;
}

/* Base Dropdown Container Sizing Wrapper */
.step-select-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 90px;
    /* Proportional boundary width tailored for 'Step X of 7' layout text */
}

/* TRANSPARENT SELECT CUSTOMIZATION FIELDS */
.custom-transparent-step-select {
    width: 100%;
    height: 32px;
    background-color: transparent !important;
    border: none !important;
    /* Removes outer border box wrapper completely */
    outline: none !important;
    box-shadow: none !important;

    padding: 4px 18px 4px 0px;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 600;
    color: #0076df;
    /* High-contrast active step blue text */
    cursor: pointer;
    appearance: none;
    /* Strips browser default checkmarks and selection panels */
}

/* Remove default focus boundaries across mobile/desktop browsers */
.custom-transparent-step-select:focus,
.custom-transparent-step-select:active {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
}

/* ALIGN DROPDOWN ARROW PERFECTLY */
.custom-native-dropdown-arrow-svg {
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
    width: 11px;
    height: 11px;
    pointer-events: none;
    /* Crucial: clicks pass straight through onto the dropdown menu */
}

/* =====================================================================
   DROPDOWN OPTIONS LIST ROW STATE COLOR RULES
   ===================================================================== */
.custom-transparent-step-select option {
    background-color: #ffffff !important;
    /* Strips default blue highlighting color box fill */
    font-weight: 500;
    padding: 8px;
}

/* 1. Active Step Option Color: Blue */
.opt-step-active {
    color: #0076df !important;
    font-weight: 600 !important;
}

/* 2. Lower Order Unlocked Steps Option Color: Active Black */
.opt-step-accessible {
    color: #1e293b !important;
}

/* 3. Higher Order Locked Steps Option Color: Disabled Gray */
.opt-step-locked,
.custom-transparent-step-select option:disabled {
    color: #94a3b8 !important;
    background-color: #f8fafc !important;
    cursor: not-allowed;
}

/* Standard structural alignment parameters utilities */
.step-separator-vertical-pipe {
    color: #cbd5e1;
    font-size: 14px;
    user-select: none;
    margin: 0 4px;
}

.step-nav-textitem {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}

.step-label-text-string {
    font-size: 13.5px;
    font-weight: 500;
    color: #1e293b;
}

.step-separator-arrow {
    color: #cbd5e1;
    font-size: 10px;
    user-select: none;
    margin: 0 4px;
}
</style>