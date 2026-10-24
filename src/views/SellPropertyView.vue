<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Advertiser } from '../models/advertisement';

// 1. Import the newly decoupled child step view modules
import Step1Auth from './sell/Step1Auth.vue';
import Step2Profile from './sell/Step2Profile.vue';

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

// Core type-safe wizard progression state engine definitions
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

// Shared database context instance passed downstream across active steps
const authenticatedAdvertiser = ref<Advertiser | null>(null);

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

// 2. Intercept successful verification payload emitted from Step 1 module layout
const handleAuthSuccess = (payload: { advertiser: any; nextStep: number }) => {
    authenticatedAdvertiser.value = payload.advertiser;
    maxVisitedStep.value = payload.nextStep as WizardStep;
    currentStep.value = payload.nextStep as WizardStep;
};

// 3. Intercept successful database profile save emitted from Step 2 module layout
const handleProfileSuccess = (updatedAdvertiser: Advertiser) => {
    authenticatedAdvertiser.value = updatedAdvertiser;
    maxVisitedStep.value = WizardStep.ADD_ADVERTISEMENT;
    currentStep.value = WizardStep.ADD_ADVERTISEMENT;
};

// Popover Menu Configuration Interactions
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
</script>
<template>
    <!-- COMMON SECTION Starts -->
    <div class="horizontal-steps-nav">

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
    <!-- COMMON SECTION ENDS -->


    <!-- STEP 1 IDENTIFICATION: Isolated Child Layer Module -->
    <Step1Auth v-if="currentStep === WizardStep.IDENTIFICATION" @auth-completed="handleAuthSuccess" />


    <!-- STEP 2 PROFILE: Render Decoupled Child Component and listen for save triggers -->
    <Step2Profile v-if="currentStep === WizardStep.PROFILE" :advertiserData="authenticatedAdvertiser"
        @profile-completed="handleProfileSuccess" />


    <!-- Placeholder Workspace UI for Remaining Setup Steps (3 to 7) -->
    <div v-if="currentStep >= 3" class="vertical-stack-form shadow-clipping-safe-zone"
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

.custom-popover-option-row {
    padding: 8px 12px;
    font-size: 13.5px;
    font-weight: 500;
    border-radius: 6px;
    white-space: nowrap;
    transition: background-color 0.15s ease;
}

.opt-custom-active {
    color: #0076df !important;
    font-weight: 600 !important;
    background-color: transparent !important;
    cursor: default;
}

.opt-custom-accessible {
    color: #1e293b !important;
    cursor: pointer;
}

.opt-custom-accessible:hover {
    background-color: #f1f5f9;
}

.opt-custom-locked {
    color: #94a3b8 !important;
    cursor: not-allowed;
    opacity: 0.6;
}

.step-separator-vertical-pipe {
    color: #cbd5e1;
    font-size: 14px;
    user-select: none;
    margin: 0 4px;
    flex-shrink: 0;
}

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
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
    color: #1e293b;
    white-space: nowrap;
    animation: slideExpand 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
   2. CHILD COMPONENT FORM HOOK INJECTIONS (DEEP INTERCEPTION RULES)
   ===================================================================== */

/* Force structural layout stacks to flow cleanly downwards */
:deep(.vertical-stack-form) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
}

/* Form Input Boundaries */
:deep(.flat-form-field) {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 48px;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 0 16px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.flat-form-field:focus-within) {
    border-color: #0076df !important;
    box-shadow: 0 0 0 3px rgba(0, 118, 223, 0.1) !important;
}

:deep(.flat-field-icon) {
    width: 18px;
    height: 18px;
    color: #64748b;
    flex-shrink: 0;
}

:deep(.flat-raw-input) {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    font-size: 14.5px;
    font-weight: 500;
    color: #1e293b;
    background-color: transparent;
}

:deep(.flat-raw-input::placeholder) {
    color: #94a3b8;
}

:deep(.flat-raw-input:disabled) {
    color: #64748b;
    cursor: not-allowed;
}

/* Radio Element Form Rows */
:deep(.borderless-flat-radio-row) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 24px;
    padding: 4px 8px;
}

:deep(.flat-radio-label-node) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
}

:deep(.custom-radio-dot) {
    position: relative;
    width: 18px;
    height: 18px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    background-color: #ffffff;
    transition: border-color 0.15s ease, background-color 0.15s ease;
}

:deep(.flat-radio-label-node input[type="radio"]:checked + .custom-radio-dot) {
    border-color: #0076df;
    background-color: #0076df;
}

:deep(.flat-radio-label-node input[type="radio"]:checked + .custom-radio-dot::after) {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #ffffff;
}

:deep(.label-caption-string) {
    font-size: 14px;
    font-weight: 550;
    color: #475569;
    transition: color 0.15s ease;
}

:deep(.flat-radio-label-node:hover .label-caption-string) {
    color: #1e293b;
}

/* Master Action Button Containers */
:deep(.flat-btn-row-wrapper) {
    width: 100%;
    display: flex;
    justify-content: flex-end;
}

:deep(.flat-full-width-action-btn) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 48px;
    background-color: #1e293b;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease, transform 0.1s ease;
}

:deep(.flat-full-width-action-btn:hover) {
    background-color: #0f172a;
}

:deep(.flat-full-width-action-btn:active) {
    transform: scale(0.995);
}

:deep(.flat-btn-icon) {
    width: 16px;
    height: 16px;
    color: #ffffff;
}

:deep(.btn-text-label) {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 0.2px;
}

/* Separator & Line Managers */
:deep(.divider-line-container) {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 4px 0;
}

:deep(.horizontal-hairline-divider) {
    width: 100%;
    height: 1px;
    background-color: #f1f5f9;
}

/* Validation Status Cards & Alerts */
:deep(.is-invalid-field) {
    border-color: #ea580c !important;
    background-color: rgba(234, 88, 12, 0.01) !important;
}

:deep(.filter-vertical-row) {
    display: flex;
    align-items: center;
    padding: 2px 4px;
}

:deep(.flat-error-descriptor-text) {
    font-size: 12.5px;
    font-weight: 600;
    color: #ea580c;
}

:deep(.flat-success-banner-card) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    background-color: rgba(0, 118, 223, 0.05);
    border: 1px solid rgba(0, 118, 223, 0.15);
    border-radius: 10px;
}

:deep(.success-check-icon) {
    width: 16px;
    height: 16px;
    color: #0076df;
}

:deep(.flat-success-descriptor-text) {
    font-size: 13.5px;
    font-weight: 600;
    color: #0076df;
}

/* =====================================================================
   3. GLOBAL NIGHT MODE DYNAMIC CONTRAST TUNERS
   ===================================================================== */
:deep(.timeline-active-label-text) {
    color: #1e293b;
    transition: color 0.25s ease;
}

/* Block A: Handles your explicit dark mode class toggle selectors */
:global(.ion-palette-dark) .timeline-active-label-text,
:global([data-theme="dark"]) .timeline-active-label-text,
:global(.ion-palette-dark) :deep(.timeline-active-label-text),
:global([data-theme="dark"]) :deep(.timeline-active-label-text) {
    color: #f8fafc !important;
}

/* Block B: Handles isolated system hardware dark mode preferences safely */
@media (prefers-color-scheme: dark) {

    .timeline-active-label-text,
    :deep(.timeline-active-label-text) {
        color: #f8fafc !important;
    }
}


:global(.ion-palette-dark) :deep(.flat-form-field),
:global([data-theme="dark"]) :deep(.flat-form-field) {
    background-color: #1e2530 !important;
    border-color: #334155 !important;
}

:global(.ion-palette-dark) :deep(.flat-raw-input),
:global([data-theme="dark"]) :deep(.flat-raw-input) {
    color: #f8fafc !important;
}

:global(.ion-palette-dark) :deep(.flat-raw-input::placeholder),
:global([data-theme="dark"]) :deep(.flat-raw-input::placeholder) {
    color: #475569 !important;
}

:global(.ion-palette-dark) :deep(.custom-radio-dot),
:global([data-theme="dark"]) :deep(.custom-radio-dot) {
    background-color: #1e2530 !important;
    border-color: #475569 !important;
}

:global(.ion-palette-dark) :deep(.label-caption-string),
:global([data-theme="dark"]) :deep(.label-caption-string) {
    color: #94a3b8 !important;
}

:global(.ion-palette-dark) :deep(.horizontal-hairline-divider),
:global([data-theme="dark"]) :deep(.horizontal-hairline-divider) {
    background-color: #334155 !important;
}

:global(.ion-palette-dark) :deep(.flat-full-width-action-btn),
:global([data-theme="dark"]) :deep(.flat-full-width-action-btn) {
    background-color: #3b82f6 !important;
}
</style>
