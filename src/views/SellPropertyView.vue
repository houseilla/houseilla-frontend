<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Advertiser } from '../models/advertisement';

// 1. Import all decoupled child steps cleanly
import Step1Auth from './sell/Step1Auth.vue';
import Step2Profile from './sell/Step2Profile.vue';
import Step3SelectAction from './sell/Step3SelectAction.vue'; // New Step 3 Import

const getStageColorClass = (stepIndex: number): string => {
    const colorMap: Record<number, string> = {
        1: 'dot-brand-blue',
        2: 'dot-brand-orange',
        3: 'dot-brand-gold',
        4: 'dot-brand-green',
        5: 'dot-brand-purple',
        6: 'dot-brand-teal',
        7: 'dot-brand-red'
    };
    return colorMap[stepIndex] || 'dot-brand-blue';
};

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
const validationError = ref(false);
const authenticatedAdvertiser = ref<Advertiser | null>(null);

// 2. NEW LIFECYCLE RECOVERY ENGINE: Restores layout tracking upon browser refreshes
onMounted(() => {
    window.addEventListener('click', handleWindowOutsideClick);

    const savedAdvertiserCache = sessionStorage.getItem('authenticatedAdvertiser');
    const savedMaxStepCache = sessionStorage.getItem('houseilla_max_visited_step');

    if (savedAdvertiserCache) {
        authenticatedAdvertiser.value = JSON.parse(savedAdvertiserCache);

        // Recover step history tracking dynamically from session state tokens
        if (savedMaxStepCache) {
            maxVisitedStep.value = parseInt(savedMaxStepCache, 10) as WizardStep;
            currentStep.value = parseInt(savedMaxStepCache, 10) as WizardStep;
        } else {
            // Default safe recovery fallback to Step 2 if data exists but step index is uncommitted
            maxVisitedStep.value = WizardStep.PROFILE;
            currentStep.value = WizardStep.PROFILE;
        }
    }
});

// Programmatic cleanup trigger to clear out wizard data rows cleanly
const triggerResetWizardSession = () => {
    // 1. Evict structural tokens and session tracking states completely
    sessionStorage.removeItem('authenticatedAdvertiser');
    sessionStorage.removeItem('houseilla_max_visited_step');
    sessionStorage.removeItem('houseilla_step1_inputs');
    sessionStorage.removeItem('houseilla_ad_flow_mode');
    sessionStorage.removeItem('houseilla_selected_ad_id');
    sessionStorage.removeItem('houseilla_selected_ad_type');

    // 2. Force the window to reload a completely fresh instance state context
    window.location.reload();
};


onUnmounted(() => window.removeEventListener('click', handleWindowOutsideClick));

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

const handleAuthSuccess = (payload: { advertiser: any; nextStep: number }) => {
    authenticatedAdvertiser.value = payload.advertiser;
    maxVisitedStep.value = payload.nextStep as WizardStep;
    currentStep.value = payload.nextStep as WizardStep;
    sessionStorage.setItem('houseilla_max_visited_step', payload.nextStep.toString());
};

const handleProfileSuccess = (updatedAdvertiser: Advertiser) => {
    authenticatedAdvertiser.value = updatedAdvertiser;
    maxVisitedStep.value = WizardStep.ADD_ADVERTISEMENT;
    currentStep.value = WizardStep.ADD_ADVERTISEMENT;
    sessionStorage.setItem('houseilla_max_visited_step', WizardStep.ADD_ADVERTISEMENT.toString());
};

// 3. NEW ACTION INTERCEPTOR FOR STEP 3: Handles inventory selection pipelines
const handleAdActionSelected = (payload: { mode: 'NEW' | 'EXISTING'; advertisementId: number | null; typeIndicator?: string }) => {
    console.log('Wizard Action Context Captured:', payload);

    // Defer form handling parameters down to memory/storage channels for Step 4 consumption
    sessionStorage.setItem('houseilla_ad_flow_mode', payload.mode);
    sessionStorage.setItem('houseilla_selected_ad_id', payload.advertisementId ? payload.advertisementId.toString() : '');
    sessionStorage.setItem('houseilla_selected_ad_type', payload.typeIndicator || '');

    // Auto-advance timeline progress to Step 4 (Property Location)
    maxVisitedStep.value = WizardStep.PROPERTY_LOCATION;
    currentStep.value = WizardStep.PROPERTY_LOCATION;
    sessionStorage.setItem('houseilla_max_visited_step', WizardStep.PROPERTY_LOCATION.toString());
};

const handleStepSync = (step: number) => {
    if (step > maxVisitedStep.value) {
        maxVisitedStep.value = step as WizardStep;
        sessionStorage.setItem('houseilla_max_visited_step', step.toString());
    }
};

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
</script>

<template>
    <!-- COMMON SECTION Starts -->
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

            <!-- DYNAMIC 7-COLOR GEOMETRIC HORIZONTAL PROGRESS TIMELINE -->
            <div class="geometric-timeline-row-container">
                <div v-for="stepNum in 7" :key="stepNum" class="timeline-step-node-item" :class="{
                    'is-active-stage': currentStep === stepNum,
                    'is-accessible-stage': stepNum <= maxVisitedStep && currentStep !== stepNum,
                    'is-locked-stage': stepNum > maxVisitedStep
                }" @click="selectCustomStep(stepNum)" :title="getStepLabel(stepNum)">
                    <span class="universal-status-dot" :class="[
                        getStageColorClass(stepNum),
                        { 'is-matt-disabled': stepNum > maxVisitedStep }
                    ]"></span>

                    <span v-if="currentStep === stepNum" class="timeline-active-label-text">
                        {{ getStepLabel(stepNum) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- 3. DEVELOPMENT TESTING TRIGGER: Polished Vector Icon to reset cache rows instantly -->
        <button type="button" @click="triggerResetWizardSession" class="wizard-icon-reset-btn"
            title="Reset Wizard Onboarding Flow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                stroke-linejoin="round" class="reset-vector-svg">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <polyline points="3 3 3 8 8 8"></polyline>
            </svg>
        </button>


    </div>
    <!-- COMMON SECTION ENDS -->



    <!-- STEP 1 IDENTIFICATION: Isolated Child Layer Module -->
    <Step1Auth v-if="currentStep === WizardStep.IDENTIFICATION" @auth-completed="handleAuthSuccess" />

    <!-- STEP 2 PROFILE: Render Decoupled Child Component and listen for save triggers -->
    <Step2Profile v-if="currentStep === WizardStep.PROFILE" :advertiserData="authenticatedAdvertiser"
        @profile-completed="handleProfileSuccess" />

    <!-- NEW STEP 3 ACTION SELECTION GRID HOOK -->
    <Step3SelectAction v-if="currentStep === WizardStep.ADD_ADVERTISEMENT" @action-selected="handleAdActionSelected"
        @sync-step-number="handleStepSync" />

    <!-- Placeholder Workspace UI for Remaining Setup Steps (4 to 7) -->
    <div v-if="currentStep >= 4" class="vertical-stack-form shadow-clipping-safe-zone"
        style="padding: 24px; background-color: #ffffff; text-align: center;">
        <h3 class="font-bold text-gray-800" style="font-size: 14px;">Step {{ currentStep }}: {{
            getStepLabel(currentStep) }} Panel Active</h3>
        <p class="text-xs text-gray-400 mt-1">Profile context synchronized for Advertiser ID: #{{
            authenticatedAdvertiser?.advertiserId }}</p>
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
   2. TIMELINE FLEX NODES AND SLIDE-EXPAND VARIABLE TYPOGRAPHY LABELS
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
    /* FIXED: Automatically targets your central high-contrast theme variables token matrix */
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
   3. DEEP WRAPPER TARGET INJECTIONS FOR DISCONNECTED CHILD FORMS
   ===================================================================== */

/* Map standard textboxes and field rows */
:deep(.flat-form-field) {
    background-color: var(--bg-color);
    border: 1.5px solid rgba(0, 0, 0, 0.08);
    transition: var(--transition-smooth);
}

:deep(.flat-field-icon) {
    color: var(--text-color);
}

:deep(.flat-raw-input),
:deep(.flat-raw-select) {
    color: var(--text-color);
}

:deep(.flat-raw-input::placeholder) {
    color: var(--text-color);
}

/* Map custom radio dots and text selections */
:deep(.label-caption-string) {
    color: var(--text-color);
}

:deep(.custom-radio-dot),
:deep(.custom-checkbox-square) {
    border: 1.5px solid rgba(0, 0, 0, 0.25);
    background-color: var(--bg-color);
    transition: var(--transition-smooth);
}

/* Map main save/action button rows */
:deep(.flat-full-width-action-btn) {
    background-color: var(--text-color);
    color: var(--bg-color);
    transition: var(--transition-smooth);
}

:deep(.flat-btn-icon) {
    color: var(--bg-color);
}

:deep(.horizontal-hairline-divider) {
    background-color: rgba(0, 0, 0, 0.08);
}

/* =====================================================================
   4. SYSTEM UTILITIES & HIGH-CONTRAST DATA THEME ADAPTATIONS
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

/* ---------------------------------------------------------------------
   DARK CONFIGURATION COMPLIANCE INJECTIONS
   --------------------------------------------------------------------- */
:global([data-theme="dark"]) {
    .custom-dropdown-popover-box {
        border-color: rgba(255, 255, 255, 0.08);
    }

    .custom-popover-option-row:hover {
        background-color: rgba(255, 255, 255, 0.04);
    }

    :deep(.flat-form-field) {
        border: 1.5px solid rgba(255, 255, 255, 0.08);
    }

    :deep(.custom-radio-dot),
    :deep(.custom-checkbox-square) {
        border: 1.5px solid rgba(255, 255, 255, 0.35);
    }

    :deep(.horizontal-hairline-divider) {
        background-color: rgba(255, 255, 255, 0.08);
    }

    .wizard-icon-reset-btn {
        background-color: rgba(249, 115, 22, 0.1);
        border-color: rgba(249, 115, orange, 0.25);
        color: #f97316;
    }
}
</style>
