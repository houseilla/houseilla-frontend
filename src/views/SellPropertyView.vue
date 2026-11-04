<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Advertisement, Advertiser } from '../models/advertisement';
import { SessionKey, WizardStep, WIZARD_STEP_LIST } from '../models/sellWizardEnums.ts';
import Step1Auth from './sell/Step1Auth.vue';
import Step2Profile from './sell/Step2Profile.vue';
import Step3SelectAction from './sell/Step3SelectAction.vue';
import Step4PropertyLocation from './sell/Step4PropertyLocation.vue';
import Step5PropertyTypePurpose from './sell/Step5PropertyTypePurpose.vue';

// --- Single Source of Truth Wizard Progression Trackers ---
const currentStep = ref<WizardStep>(
    Number(sessionStorage.getItem(SessionKey.CURRENT_STEP)) || WizardStep.IDENTIFICATION
);

const maxStepUnlocked = ref<WizardStep>(
    Number(sessionStorage.getItem(SessionKey.MAX_STEP)) || WizardStep.IDENTIFICATION
);

const authenticatedAdvertiser = ref<Advertiser | null>(null);
const advertisementOperation = ref<'NEW' | 'EXISTING' | null>(
    (sessionStorage.getItem(SessionKey.ADVERTISEMENT_OPERATION) as 'NEW' | 'EXISTING') || null
);

const isMapExpanded = ref<boolean>(false);
const dropdownElementRef = ref<HTMLElement | null>(null);

// --- Core Event Dispatches & Routing Handlers ---
const handleAuthSuccess = (payload: { otpVerified: boolean; token: string; advertiser: Advertiser }) => {
    sessionStorage.setItem(SessionKey.OTP_VERIFIED, String(payload.otpVerified));
    sessionStorage.setItem(SessionKey.AUTH_TOKEN, payload.token);
    sessionStorage.setItem(SessionKey.ADVERTISER, JSON.stringify(payload.advertiser));

    authenticatedAdvertiser.value = payload.advertiser;
    currentStep.value = WizardStep.PROFILE;
    sessionStorage.setItem(SessionKey.CURRENT_STEP, String(WizardStep.PROFILE));

    if (maxStepUnlocked.value < WizardStep.PROFILE) {
        maxStepUnlocked.value = WizardStep.PROFILE;
        sessionStorage.setItem(SessionKey.MAX_STEP, String(WizardStep.PROFILE));
    }
};

const handleProfileSuccess = (updatedAdvertiser: Advertiser) => {
    sessionStorage.setItem(SessionKey.ADVERTISER, JSON.stringify(updatedAdvertiser));
    authenticatedAdvertiser.value = updatedAdvertiser;

    currentStep.value = WizardStep.SELECT_ACTION;
    sessionStorage.setItem(SessionKey.CURRENT_STEP, String(WizardStep.SELECT_ACTION));

    if (maxStepUnlocked.value < WizardStep.SELECT_ACTION) {
        maxStepUnlocked.value = WizardStep.SELECT_ACTION;
        sessionStorage.setItem(SessionKey.MAX_STEP, String(WizardStep.SELECT_ACTION));
    }
};

const handleActionSelected = (payload: { mode: 'NEW' | 'EXISTING'; advertisementId: number | null }) => {
    advertisementOperation.value = payload.mode;
    sessionStorage.setItem(SessionKey.ADVERTISEMENT_OPERATION, payload.mode);

    currentStep.value = WizardStep.PROPERTY_LOCATION;
    sessionStorage.setItem(SessionKey.CURRENT_STEP, String(WizardStep.PROPERTY_LOCATION));

    if (maxStepUnlocked.value < WizardStep.PROPERTY_LOCATION) {
        maxStepUnlocked.value = WizardStep.PROPERTY_LOCATION;
        sessionStorage.setItem(SessionKey.MAX_STEP, String(WizardStep.PROPERTY_LOCATION));
    }
};


const handleLocationSuccess = (completedAdvertisement: Advertisement) => {
    // 1. Commit the expanded location details directly to session storage
    sessionStorage.setItem(SessionKey.ADVERTISEMENT, JSON.stringify(completedAdvertisement));

    // 2. Route the user onward cleanly to Step 5 (PROPERTY_TYPE_PURPOSE)
    currentStep.value = WizardStep.PROPERTY_TYPE_PURPOSE;
    sessionStorage.setItem(SessionKey.CURRENT_STEP, String(WizardStep.PROPERTY_TYPE_PURPOSE));

    if (maxStepUnlocked.value < WizardStep.PROPERTY_TYPE_PURPOSE) {
        maxStepUnlocked.value = WizardStep.PROPERTY_TYPE_PURPOSE;
        sessionStorage.setItem(SessionKey.MAX_STEP, String(WizardStep.PROPERTY_TYPE_PURPOSE));
    }

    console.log('%c[SellProperty Parent] Step 4 complete. Location added, advanced to Step 5.', 'color: #2ecc71; font-weight: bold;');
};

const handleTypePurposeSuccess = (completedPayload: any) => {
    // 1. Commit the expanded dataset parameters directly into Session Storage
    sessionStorage.setItem(SessionKey.ADVERTISEMENT, JSON.stringify(completedPayload));

    // 2. Advance active view tracker directly to the next level index
    currentStep.value = WizardStep.PROPERTY_DETAILS;
    sessionStorage.setItem(SessionKey.CURRENT_STEP, String(WizardStep.PROPERTY_DETAILS));

    if (maxStepUnlocked.value < WizardStep.PROPERTY_DETAILS) {
        maxStepUnlocked.value = WizardStep.PROPERTY_DETAILS;
        sessionStorage.setItem(SessionKey.MAX_STEP, String(WizardStep.PROPERTY_DETAILS));
    }
    console.log('%c[SellProperty Parent] Step 5 complete. Data saved, advanced to Step 6.', 'color: #2ecc71; font-weight: bold;');
};

const selectCustomStep = (targetStepId: WizardStep) => {
    if (targetStepId <= maxStepUnlocked.value) {
        currentStep.value = targetStepId;
        sessionStorage.setItem(SessionKey.CURRENT_STEP, String(targetStepId));
        isMapExpanded.value = false;
    }
};

const triggerResetWizardSession = () => {
    sessionStorage.clear();
    window.location.reload();
};

const handleWindowOutsideClick = (event: MouseEvent) => {
    const targetNode = event.target as HTMLElement;
    if (isMapExpanded.value && dropdownElementRef.value && !dropdownElementRef.value.contains(targetNode)) {
        isMapExpanded.value = false;
    }
};

// --- Lifecycle State Recovery Hydration Engine ---
onMounted(() => {
    window.addEventListener('click', handleWindowOutsideClick);

    const savedAdvertiser = sessionStorage.getItem(SessionKey.ADVERTISER);
    const savedCurrentStep = sessionStorage.getItem(SessionKey.CURRENT_STEP);
    const savedMaxStep = sessionStorage.getItem(SessionKey.MAX_STEP);

    if (savedAdvertiser) {
        authenticatedAdvertiser.value = JSON.parse(savedAdvertiser);
    }
    if (savedCurrentStep) {
        currentStep.value = parseInt(savedCurrentStep, 10) as WizardStep;
    }
    if (savedMaxStep) {
        maxStepUnlocked.value = parseInt(savedMaxStep, 10) as WizardStep;
    } else if (savedCurrentStep) {
        maxStepUnlocked.value = parseInt(savedCurrentStep, 10) as WizardStep;
        sessionStorage.setItem(SessionKey.MAX_STEP, savedCurrentStep);
    }
});

onUnmounted(() => {
    window.removeEventListener('click', handleWindowOutsideClick);
});
</script>

<template>
    <!-- COMMON NAVIGATION CONTROL ROW STARTS -->
    <div class="horizontal-steps-nav" style="justify-content: space-between;">

        <div style="display: flex; align-items: center; gap: 12px;">
            <!-- CUSTOM INLINE POPOVER TRIGGER ENGINE -->
            <div class="step-custom-dropdown-container" ref="dropdownElementRef">
                <div class="custom-step-trigger-btn" @click="isMapExpanded = !isMapExpanded">
                    <span class="active-count-num">Step {{ currentStep }} of 7</span>
                    <svg class="custom-native-dropdown-arrow-svg" :class="{ 'arrow-rotated': isMapExpanded }"
                        viewBox="0 0 24 24" fill="none">
                        <path d="M6 9l6 6 6-6" stroke="#0076df" stroke-width="3" stroke-linecap="round"
                            stroke-linejoin="round" />
                    </svg>
                </div>

                <!-- CUSTOM POPUP MENU -->
                <div v-if="isMapExpanded" class="custom-dropdown-popover-box" @click.stop>
                    <div v-for="step in WIZARD_STEP_LIST" :key="step.id" class="custom-popover-option-row" :class="{
                        'opt-custom-active': currentStep === step.id,
                        'opt-custom-accessible': step.id <= maxStepUnlocked && currentStep !== step.id,
                        'opt-custom-locked': step.id > maxStepUnlocked
                    }" @click="selectCustomStep(step.id)">
                        {{ currentStep === step.id ? `Step ${step.id} of 7` : `Step ${step.id} of 7: ${step.label}` }}
                    </div>
                </div>
            </div>

            <span class="step-separator-vertical-pipe">|</span>

            <!-- DYNAMIC 7-COLOR GEOMETRIC HORIZONTAL PROGRESS TIMELINE -->
            <div class="geometric-timeline-row-container">
                <div v-for="step in WIZARD_STEP_LIST" :key="step.id" class="timeline-step-node-item" :class="{
                    'is-active-stage': currentStep === step.id,
                    'is-accessible-stage': step.id <= maxStepUnlocked && currentStep !== step.id,
                    'is-locked-stage': step.id > maxStepUnlocked
                }" @click="selectCustomStep(step.id)" :title="step.label">

                    <span class="universal-status-dot" :class="[
                        step.colorClass,
                        { 'is-matt-disabled': step.id > maxStepUnlocked }
                    ]"></span>

                    <span v-if="currentStep === step.id" class="timeline-active-label-text">
                        {{ step.label }}
                    </span>
                </div>
            </div>
        </div>

        <!-- DEVELOPMENT TESTING TRIGGER BUTTON -->
        <button type="button" @click="triggerResetWizardSession" class="wizard-icon-reset-btn"
            title="Reset Wizard Onboarding Flow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                stroke-linejoin="round" class="reset-vector-svg">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <polyline points="3 3 3 8 8 8"></polyline>
            </svg>
        </button>

    </div>
    <!-- COMMON NAVIGATION CONTROL ROW ENDS -->

    <!-- STEP 1 IDENTIFICATION -->
    <Step1Auth v-if="currentStep === WizardStep.IDENTIFICATION" :advertiserData="authenticatedAdvertiser"
        @auth-completed="handleAuthSuccess" />

    <!-- STEP 2 PROFILE SETUP -->
    <Step2Profile v-if="currentStep === WizardStep.PROFILE" :advertiserData="authenticatedAdvertiser"
        @profile-completed="handleProfileSuccess" />

    <!-- STEP 3 PATH SELECTOR -->
    <Step3SelectAction v-if="currentStep === WizardStep.SELECT_ACTION" :operationMode="advertisementOperation"
        @action-selected="handleActionSelected" />

    <!-- STEP 4 PROPERTY LOCATION -->
    <Step4PropertyLocation v-if="currentStep === WizardStep.PROPERTY_LOCATION"
        @location-completed="handleLocationSuccess" />

    <!-- STEP 5 PROPERTY TYPE & TRANSACTION PURPOSE SELECTOR -->
    <Step5PropertyTypePurpose v-if="currentStep === WizardStep.PROPERTY_TYPE_PURPOSE"
        :advertisementData="authenticatedAdvertiser" @type-purpose-completed="handleTypePurposeSuccess" />



    <div v-if="currentStep === WizardStep.PROPERTY_DETAILS" class="vertical-stack-form shadow-clipping-safe-zone"
        style="padding: 24px; background-color: #ffffff; text-align: center;">
        <span class="label-caption-string"
            style="font-weight: bold; font-size: 14px; display: block; margin-bottom: 8px;">
            Step 6: PROPERTY_DETAILS Workspace
        </span>
        <p class="text-xs text-gray-400">Operation Mode: {{ advertisementOperation }}</p>
    </div>

    <!-- DOWNSTREAM STEPS WORKSPACE CANVASES (6 to 7) -->
    <div v-if="currentStep >= WizardStep.PROPERTY_DETAILS" class="vertical-stack-form shadow-clipping-safe-zone"
        style="padding: 24px; background-color: #ffffff; text-align: center;">
        <h3 class="font-bold text-gray-800" style="font-size: 14px;">
            Step {{ currentStep }}: {{ WIZARD_STEP_LIST[currentStep - 1]?.label }} Panel Active
        </h3>
    </div>
</template>

<style scoped>
/* =====================================================================
   1. MASTER CONTAINER FRAMEWORK NAVIGATION & PROGRESS TIMELINE
   ===================================================================== */
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
    flex-shrink: 0;
}

.custom-step-trigger-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    cursor: pointer;
    user-select: none;
    padding-right: 8px;
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

.custom-dropdown-popover-box {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 290px;
    background-color: var(--bg-color);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    z-index: 9999;
}

.custom-popover-option-row {
    padding: 8px 12px;
    font-size: 13.5px;
    font-weight: 500;
    border-radius: 6px;
    white-space: nowrap;
    color: var(--text-color);
    transition: var(--transition-smooth);
}

.opt-custom-active {
    color: #0076df !important;
    font-weight: 600 !important;
    background-color: transparent !important;
    cursor: default;
}

.opt-custom-accessible {
    cursor: pointer;
}

.opt-custom-accessible:hover {
    background-color: rgba(0, 0, 0, 0.04);
}

.opt-custom-locked {
    opacity: 0.4;
    cursor: not-allowed;
}

.step-separator-vertical-pipe {
    color: var(--text-color);
    opacity: 0.2;
    font-size: 14px;
    user-select: none;
    margin: 0 4px;
    flex-shrink: 0;
}

/* =====================================================================
   2. TIMELINE FLEX NODES AND SLIDE-EXPAND VARIABLE LABELS
   ===================================================================== */
.geometric-timeline-row-container {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
}

.timeline-step-node-item {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: var(--transition-smooth);
}

.is-active-stage {
    cursor: default;
}

.is-accessible-stage {
    cursor: pointer;
}

.is-locked-stage {
    cursor: not-allowed;
}

.is-accessible-stage:hover .universal-status-dot {
    transform: scale(1.15);
}

.timeline-active-label-text {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    animation: slideExpand 0.25s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
    transition: var(--transition-smooth);
}

@keyframes slideExpand {
    from {
        opacity: 0;
        transform: translateX(-6px);
        max-width: 0;
    }

    to {
        opacity: 1;
        transform: translateX(0);
        max-width: 300px;
    }
}

/* =====================================================================
   3. SYSTEM DEV TESTING RESET TRIGGERS
   ===================================================================== */
.wizard-icon-reset-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: rgba(234, 88, 12, 0.06);
    border: 1px solid rgba(234, 88, 12, 0.15);
    border-radius: 8px;
    color: #ea580c;
    cursor: pointer;
    user-select: none;
    transition: var(--transition-smooth);
    flex-shrink: 0;
}

.wizard-icon-reset-btn:hover {
    background-color: rgba(234, 88, 12, 0.12);
}

.wizard-icon-reset-btn:active {
    transform: scale(0.92);
}

.reset-vector-svg {
    width: 15px;
    height: 15px;
}

/* Dark Theme Adjustments */
:global([data-theme="dark"]) {
    .custom-dropdown-popover-box {
        border-color: rgba(255, 255, 255, 0.08);
    }

    .custom-popover-option-row:hover {
        background-color: rgba(255, 255, 255, 0.04);
    }

    .wizard-icon-reset-btn {
        background-color: rgba(249, 115, 22, 0.1);
        border-color: rgba(249, 115, 22, 0.25);
        color: #f97316;
    }
}
</style>
