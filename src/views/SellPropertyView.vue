<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { authService } from '../services/authService';
import type { OtpRequest } from '../models/auth';
import type { Advertiser } from '../models/advertisement';
// Pulls your existing enum labels map straight from your project's configuration file
import { AdvertiserType, AdvertiserTypeLabels, getAdvertiserTypeLabel } from '../models/enums';


// =====================================================================
// A. CORE STATE WIZARD LAYOUT SWITCH ENUMS
// =====================================================================
enum WizardStep {
    IDENTIFICATION = 1,
    PROFILE = 2,
    ADD_ADVERTISEMENT = 3,
    PROPERTY_LOCATION = 4,
    PROPERTY_TYPE_PURPOSE = 5,
    PROPERTY_DETAILS = 6,
    PHOTOS_MEDIA = 7
}

const currentStep = ref<WizardStep>(WizardStep.IDENTIFICATION);
const maxVisitedStep = ref<WizardStep>(WizardStep.IDENTIFICATION);

const isOtpSent = ref(false);
const isOtpVerified = ref(false);
const isOtpSuccess = ref(false);
const validationError = ref(false);
const errorMessage = ref('');

const authForm = ref<OtpRequest>({
    phone: '',
    email: '',
    otpCode: ''
});

const authenticatedAdvertiser = ref<Advertiser | null>(null);

// Dynamic mapping dictionary for step tracking text strings
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

// =====================================================================
// B. REGEX UTILITY VALIDATORS
// =====================================================================
const isPhoneValid = () => /^\d{10}$/.test(authForm.value.phone.trim());
const isEmailValid = () => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(authForm.value.email.trim());
const isOtpValid = () => /^\d{6}$/.test(authForm.value.otpCode.trim());

const isNameValid = () => authenticatedAdvertiser.value && authenticatedAdvertiser.value.advertiserName.trim().length > 0;
const isTypeValid = () => authenticatedAdvertiser.value && authenticatedAdvertiser.value.advertiserType > 0;

// =====================================================================
// C. API TRANSACTION DISPATCH METRICS
// =====================================================================
const verifyAdvertiser = async () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!isPhoneValid() || !isEmailValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid phone number and formatted email address.';
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
    }
};

const confirmOtpVerification = async () => {
    validationError.value = false;
    errorMessage.value = '';
    isOtpSuccess.value = false;

    if (!isOtpValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter a valid 6-digit numeric OTP.';
        return;
    }

    try {
        const data = await authService.verifyOtp(authForm.value);

        if (data.success) {
            console.log('OTP Verification Passed Successfully!');
            isOtpVerified.value = true;
            isOtpSuccess.value = true;

            // FIXED CONDITION MATCH: Read data directly from your backend key response map
            if (data.isPreExisting && data.advertiser) {
                authenticatedAdvertiser.value = data.advertiser;
                console.log('Pre-existing advertiser row verified. Promoting straight to update profile view.');
                maxVisitedStep.value = WizardStep.PROFILE;
                currentStep.value = WizardStep.PROFILE;
            } else {
                // Build new blank template entity data object layout values
                authenticatedAdvertiser.value = {
                    advertiserId: 0,
                    advertiserName: '',
                    isPremium: 0,
                    advertiserType: 0,
                    advertiserPhone: authForm.value.phone.trim(),
                    advertiserEmail: authForm.value.email.trim()
                };
                console.log('Fresh Advertiser Profile Successfully Initialized:', authenticatedAdvertiser.value);
                maxVisitedStep.value = WizardStep.PROFILE;
                currentStep.value = WizardStep.PROFILE;
            }
        } else {
            validationError.value = true;
            errorMessage.value = data.message || 'The verification code entered is incorrect.';
        }
    } catch (error) {
        validationError.value = true;
        errorMessage.value = 'Failed to process verification code validation.';
    }
};

const saveAdvertiserProfile = () => {
    validationError.value = false;
    errorMessage.value = '';

    if (!isNameValid() || !isTypeValid()) {
        validationError.value = true;
        errorMessage.value = 'Please enter your name and select your advertiser profile type.';
        return;
    }
    console.log('Profile details verified successfully. Moving forward:', authenticatedAdvertiser.value);
    // maxVisitedStep.value = WizardStep.ADD_ADVERTISEMENT;
    // currentStep.value = WizardStep.ADD_ADVERTISEMENT;
};

// =====================================================================
// D. CLICK-OUTSIDE DISPATCH POPOVER MAP INTERACTIVE ROUTERS
// =====================================================================
const isMapExpanded = ref(false);
const dropdownElementRef = ref<HTMLElement | null>(null);

const handleWindowOutsideClick = (event: MouseEvent) => {
    const targetNode = event.target as HTMLElement;
    if (isMapExpanded.value && dropdownElementRef.value && !dropdownElementRef.value.contains(targetNode)) {
        isMapExpanded.value = false;
    }
};

const selectCustomStep = (targetStepNumber: number) => {
    const targetStep = targetStepNumber as WizardStep;
    if (targetStep <= maxVisitedStep.value) {
        currentStep.value = targetStep;
        isMapExpanded.value = false;
        validationError.value = false;
    }
};

onMounted(() => window.addEventListener('click', handleWindowOutsideClick));
onUnmounted(() => window.removeEventListener('click', handleWindowOutsideClick));

const advertiserTypeOptions = computed(() => {
    // Directly loops through your strict numeric keys (0, 1, 2) to maintain perfect type protection
    return [AdvertiserType.BROKER, AdvertiserType.BUILDER, AdvertiserType.INDIVIDUAL].map((enumValue) => ({
        value: enumValue,
        label: getAdvertiserTypeLabel(enumValue) // Natively pulls: 'Broker / Agent', etc.
    }));
});
</script>

<template>

    <!--
    COMMON SECTION Starts
    -->
    <div class="horizontal-steps-nav">

        <!-- CUSTOM INLINE POPOVER TRIGGER ENGINE -->
        <div class="step-custom-dropdown-container" ref="dropdownElementRef">

            <!-- Clickable Text Button Label acting as the display node -->
            <div class="custom-step-trigger-btn" @click="isMapExpanded = !isMapExpanded">
                <span class="active-count-num">Step {{ currentStep }} of 7</span>
                <svg class="custom-native-dropdown-arrow-svg" :class="{ 'arrow-rotated': isMapExpanded }"
                    viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="#0076df" stroke-width="3" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </div>

            <!-- CUSTOM POPUP MENU: Displays cleanly with 0% native tick marks or overrides -->
            <div v-if="isMapExpanded" class="custom-dropdown-popover-box" @click.stop>
                <div v-for="stepNum in 7" :key="stepNum" class="custom-popover-option-row" :class="{
                    'opt-custom-active': currentStep === stepNum,
                    'opt-custom-accessible': stepNum <= maxVisitedStep && currentStep !== stepNum,
                    'opt-custom-locked': stepNum > maxVisitedStep
                }" @click="selectCustomStep(stepNum)">
                    {{ currentStep === stepNum ? `Step ${stepNum} of 7` : `Step ${stepNum} of 7:
                    ${getStepLabel(stepNum)}` }}
                </div>
            </div>
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

    <!--
    COMMON SECTION ENDS
    -->


    <!--STEP 1 IDENTIFICATION STARTS-->

    <div v-if="currentStep === WizardStep.IDENTIFICATION" class="vertical-stack-form shadow-clipping-safe-zone">

        <!-- Phone Number Input Field Wrapper -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isPhoneValid() }">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <!-- CORES LOCK RULE: Keeps field uneditable once OTP check passes -->
            <input type="tel" class="flat-raw-input" placeholder="Enter Phone Number..." v-model="authForm.phone"
                maxlength="10" @input="authForm.phone = authForm.phone.replace(/\D/g, '')"
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
                @input="authForm.email = authForm.email.trim().toLowerCase()" :disabled="isOtpSent || isOtpVerified" />
        </div>

        <!-- Validation Error Placement at Bottom -->
        <div v-if="validationError" class="filter-vertical-row">
            <span class="flat-error-descriptor-text">
                {{ errorMessage }}
            </span>
        </div>

        <!-- SUCCESS PLACEHOLDER BANNER: Appears in Area 1 when verification completes -->
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

        <!-- Step 2 Dynamic Reveal: OTP Code Input Section -->

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

        <!-- ACTION TRIGGER ZONE: Entire button container collapses out of view when verified -->
        <div v-if="!isOtpVerified" class="flat-btn-row-wrapper">
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
    <!--STEP 1 IDENTIFICATION Ends-->


    <!-- ========================================== -->
    <!-- STEP 2: ADVERTISER PROFILE VIEWS           -->
    <!-- ========================================== -->
    <div v-if="currentStep === WizardStep.PROFILE" class="vertical-stack-form shadow-clipping-safe-zone">
        <!--
        <div class="universal-view-header-row" style="margin-bottom: 12px;">
            <h3 style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0;">
                {{ authenticatedAdvertiser?.advertiserId ? 'Update Profile Details' : 'Advertiser Profile Details' }}
            </h3>
        </div>
        -->

        <!-- 1. LOCKED VERIFIED PHONE NUMBER FIELD ON TOP -->
        <div class="flat-form-field">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <input type="tel" class="flat-raw-input" v-model="authenticatedAdvertiser!.advertiserPhone" disabled />
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
            <input type="email" class="flat-raw-input" v-model="authenticatedAdvertiser!.advertiserEmail" disabled />
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- 3. EDITABLE FULL NAME INPUT FIELD -->
        <div class="flat-form-field" :class="{ 'is-invalid-field': validationError && !isNameValid() }">
            <svg class="flat-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
            <input type="text" class="flat-raw-input" placeholder="Enter Full Name..."
                v-model="authenticatedAdvertiser!.advertiserName" />
        </div>

        <div class="divider-line-container">
            <span class="horizontal-hairline-divider"></span>
        </div>

        <!-- 4. EDITABLE ADVERTISER TYPE RADIO SELECTION BLOCK -->
        <div class="borderless-flat-radio-row" :class="{ 'is-invalid-field': validationError && !isTypeValid() }">
            <label v-for="option in advertiserTypeOptions" :key="option.value" class="flat-radio-label-node"
                :class="{ 'is-active-node': option.value === authenticatedAdvertiser!.advertiserType }">
                <input type="radio" name="advertiserTypeGroup" :value="option.value"
                    v-model="authenticatedAdvertiser!.advertiserType"
                    style="position: absolute; opacity: 0; width: 0; height: 0;" />
                <span class="custom-radio-dot"></span>
                <span class="label-caption-string">{{ option.label }}</span>
            </label>
        </div>

        <!-- Local Validation Error Display block -->
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
            <button @click="saveAdvertiserProfile" class="flat-full-width-action-btn" type="button">
                <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                </svg>
                <span class="btn-text-label">
                    {{ authenticatedAdvertiser?.advertiserId ?
                        'Update Profile Details' : 'SaveProfile Details' }}
                </span>
            </button>
        </div>

    </div>
    <!-- STEP 2 PROFILE ENDS -->

</template>

<style scoped>
/* Scoped configurations matching BuyPropertyView configuration hooks */
.otp-verification-wrapper {
    width: 100%;
}

/* Container framework alignment rules */
.horizontal-steps-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 24px;
}

.step-custom-dropdown-container {
    position: relative;
    display: inline-block;
}

/* Custom layout trigger text label node */
.custom-step-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    cursor: pointer;
    user-select: none;
}

.active-count-num {
    font-size: 13.5px;
    font-weight: 600;
    color: #0076df;
}

.custom-native-dropdown-arrow-svg {
    width: 10px;
    height: 10px;
    transition: transform 0.2s ease;
}

.arrow-rotated {
    transform: rotate(180deg);
}

/* FLOATING INDEPENDENT OVERLAY LIST BOX POPUP CONTAINER */
.custom-dropdown-popover-box {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 290px;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    z-index: 9999;
}

/* INDIVIDUAL CUSTOM ROW SELECTION ITEMS */
.custom-popover-option-row {
    padding: 8px 12px;
    font-size: 13.5px;
    font-weight: 500;
    border-radius: 6px;
    white-space: nowrap;
    transition: background-color 0.15s ease;
}

/* CUSTOM HIGHLIGHTING STATE COLORS (0% TICK MARKS) */
/* 1. Active Step State: Blue text, no blue panel fill background */
.opt-custom-active {
    color: #0076df !important;
    font-weight: 600 !important;
    background-color: transparent !important;
    cursor: default;
}

/* 2. Unlocked Lower Order Steps State: Active Black */
.opt-custom-accessible {
    color: #1e293b !important;
    cursor: pointer;
}

.opt-custom-accessible:hover {
    background-color: #f1f5f9;
}

/* 3. Locked Higher Order Steps State: Disabled Gray */
.opt-custom-locked {
    color: #94a3b8 !important;
    cursor: not-allowed;
    opacity: 0.6;
}

/* Flat UI Spacers & Elements Utilities */
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

/* Custom Flat Success Box Design Tokens */
.flat-success-banner-card {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    background-color: #f0fdf4;
    /* Clean soft light green tint fill background */
    border: 1px solid #bbf7d0;
    /* Subtle light green tracking border outline */
    border-radius: 8px;
    box-sizing: border-box;
}

.success-check-icon {
    width: 15px;
    height: 15px;
    color: #16a34a;
    /* Flat Accent Forest Green Check Token */
    flex-shrink: 0;
}

.flat-success-descriptor-text {
    font-size: 13.5px;
    font-weight: 500;
    color: #16a34a;
    /* Matching text color theme metrics */
    font-family: inherit;
}

/* Smooth micro-interaction arrival overlay animation */
.animation-fade-in-smooth {
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>