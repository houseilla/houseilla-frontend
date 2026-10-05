<script setup lang="ts">
import { ref, nextTick } from 'vue'

// Import Sub-View Shell Components
import AboutView from '../views/AboutView.vue'
import ContactView from '../views/ContactView.vue'
import ServicesView from '../views/ServicesView.vue'
import BlogView from '../views/BlogView.vue'
import BuyPropertyView from '../views/BuyPropertyView.vue'
import SellPropertyView from '../views/SellPropertyView.vue'
import PremiumPortfolioView from '../views/PremiumPortfolioView.vue'
import VerifiedHubView from '../views/VerifiedHubView.vue'
import PropertyListingView from '../views/PropertyListingView.vue'

// 1. Injects your upcoming new standalone details sub-view page module
import PropertyDetailsView from '../views/PropertyDetailsView.vue'

// Import strict data type interfaces
import type { Advertisement } from '../models/advertisement'

// Navigation Engine Router State Matrix (Added 'details' state option)
const currentViewState = ref<'home' | 'about' | 'services' | 'contact' | 'blog' | 'buy' | 'sell' | 'premium' | 'verified' | 'listings' | 'details'>('home')
const buyViewRef = ref<InstanceType<typeof BuyPropertyView> | null>(null)

// Shared Reactive Results Data Containers
const globalFilteredAdvertisementsList = ref<Advertisement[]>([])
const activeSelectedAdvertisement = ref<Advertisement | null>(null)

/**
 * Changes active layout views
 */
const setViewState = (state: typeof currentViewState.value) => {
    currentViewState.value = state
}

/**
 * Triggered by the child form when data is filtered successfully
 */
const handleSearchExecutionSuccess = (results: Advertisement[]) => {
    globalFilteredAdvertisementsList.value = results
    setViewState('listings')
}

/**
 * NEW ROUTING TRIGGER: Intercepts property card choice click, 
 * buffers data payload, and opens full-width details view canvas inline
 */
const handlePropertyCardSelection = (selectedAd: Advertisement) => {
    activeSelectedAdvertisement.value = selectedAd
    setViewState('details')
}

/**
 * Toggles Buy Property state view and targets field autofocus triggers
 */
const handleBuyPropertyClick = () => {
    setViewState('buy')
    nextTick(() => {
        buyViewRef.value?.focusInput()
    })
}

/**
 * Maps readable header title string labels for the sub-view dashboard panels
 */
const getPageTitle = () => {
    switch (currentViewState.value) {
        case 'buy': return 'Buy Property'
        case 'sell': return 'Sell Property'
        case 'premium': return 'Premium Property Portfolio'
        case 'verified': return 'Verified Property Hub'
        case 'about': return 'About Us'
        case 'services': return 'Our Services'
        case 'contact': return 'Contact Us'
        case 'blog': return 'Blog Dock'
        case 'listings': return 'Property Listings'
        case 'details': return 'Property Details Profile'
        default: return ''
    }
}
</script>

<template>
    <div class="split-view-master-canvas">

        <!-- LEFT SIDEBAR: Interactive Edge Navigation Tabs Matrix -->
        <div class="sidebar-edge-cluster left-edge-cluster">
            <div @click="setViewState('about')" class="vertical-side-label tab-spacing-1">
                <span class="tab-text-rotator">ABOUT US</span>
            </div>
            <div @click="setViewState('contact')" class="vertical-side-label tab-spacing-2">
                <span class="tab-text-rotator">CONTACT US</span>
            </div>
        </div>

        <!-- MAIN CORE WORKSPACE SYSTEM WINDOW (The Main Area) -->
        <div class="center-workspace-window">
            <Transition name="slide-horizontal" mode="out-in">

                <!-- CONDITION 1: Render Baseline Split Dashboard Grid -->
                <div v-if="!['about', 'contact', 'services', 'blog', 'listings', 'details'].includes(currentViewState)"
                    class="sketch-dashboard-grid" key="dashboard">

                    <div class="mascot-column-wrapper">
                        <img src="/illa-support.png" alt="Houseilla Consultant Mascot" class="brand-mascot-img" />
                    </div>

                    <div class="center-menu-column">
                        <Transition name="slide-horizontal" mode="out-in">

                            <div v-if="currentViewState === 'home'" class="menu-view-slide-wrapper">
                                <h2 class="neomorphic-panel-title">Explore Houseilla</h2>
                                <div class="neomorphic-actions-list-container shadow-clipping-safe-zone">

                                    <div @click="handleBuyPropertyClick" class="neo-action-card-button">
                                        <span class="card-left-content">
                                            <span class="action-bullet-indicator bullet-blue"></span>
                                            <span class="action-row-text-title">Buy Property</span>
                                        </span>
                                        <svg class="action-arrow-pointer-icon" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2.5">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>

                                    <div @click="setViewState('sell')" class="neo-action-card-button">
                                        <span class="card-left-content">
                                            <span class="action-bullet-indicator bullet-orange"></span>
                                            <span class="action-row-text-title">Sell Property</span>
                                        </span>
                                        <svg class="action-arrow-pointer-icon" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2.5">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>

                                    <div @click="setViewState('premium')" class="neo-action-card-button">
                                        <span class="card-left-content">
                                            <span class="action-bullet-indicator bullet-gold"></span>
                                            <span class="action-row-text-title">Premium Property Portfolio</span>
                                        </span>
                                        <svg class="action-arrow-pointer-icon" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2.5">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>

                                    <div @click="setViewState('verified')" class="neo-action-card-button">
                                        <span class="card-left-content">
                                            <span class="action-bullet-indicator bullet-green"></span>
                                            <span class="action-row-text-title">Verified Property Hub</span>
                                        </span>
                                        <svg class="action-arrow-pointer-icon" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="2.5">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </div>

                                </div>
                            </div>

                            <div v-else-if="['buy', 'sell', 'premium', 'verified'].includes(currentViewState)"
                                class="menu-view-slide-wrapper">
                                <div class="inner-panel-header-row">
                                    <h2 class="flat-panel-title">{{ getPageTitle() }}</h2>
                                    <button @click="setViewState('home')" class="borderless-back-arrow-btn"
                                        aria-label="Back">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" stroke-width="3" stroke-linecap="round"
                                            stroke-linejoin="round">
                                            <line x1="19" y1="12" x2="5" y2="12"></line>
                                            <polyline points="12 19 5 12 12 5"></polyline>
                                        </svg>
                                    </button>
                                </div>

                                <BuyPropertyView v-if="currentViewState === 'buy'" ref="buyViewRef"
                                    @on-search-success="handleSearchExecutionSuccess" />
                                <SellPropertyView v-else-if="currentViewState === 'sell'" />
                                <PremiumPortfolioView v-else-if="currentViewState === 'premium'" />
                                <VerifiedHubView v-else-if="currentViewState === 'verified'" />
                            </div>

                        </Transition>
                    </div>
                </div>

                <!-- CONDITION 2 & SKETCH 4 COMPLIANCE: Standalone page containers inside the Main Area -->
                <div v-else class="menu-view-slide-wrapper full-width-main-area-adjust" :key="currentViewState">

                    <!-- Universal Header structure driven natively by main.css global tokens -->
                    <div class="universal-view-header-row">
                        <h2 class="universal-view-main-title">{{ getPageTitle() }}</h2>
                        <button
                            @click="currentViewState === 'listings' ? setViewState('buy') : (currentViewState === 'details' ? setViewState('listings') : setViewState('home'))"
                            class="universal-back-arrow-btn" type="button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                    </div>

                    <!-- Component Render Routing Matrix -->
                    <AboutView v-if="currentViewState === 'about'" />
                    <ContactView v-else-if="currentViewState === 'contact'" />
                    <ServicesView v-if="currentViewState === 'services'" />
                    <BlogView v-else-if="currentViewState === 'blog'" />

                    <!-- Listings page listening to card choice selections -->
                    <PropertyListingView v-else-if="currentViewState === 'listings'"
                        :advertisements="globalFilteredAdvertisementsList"
                        @on-card-click="handlePropertyCardSelection" />

                    <!-- Brand new dedicated full width details profile component injector -->
                    <PropertyDetailsView v-else-if="currentViewState === 'details' && activeSelectedAdvertisement"
                        :advertisement="activeSelectedAdvertisement" />
                </div>

            </Transition>
        </div>

        <!-- RIGHT SIDEBAR tabs matrix anchor -->
        <div class="sidebar-edge-cluster right-edge-cluster">
            <div @click="setViewState('services')" class="vertical-side-label tab-spacing-1">
                <span class="tab-text-rotator">OUR SERVICES</span>
            </div>
            <div @click="setViewState('blog')" class="vertical-side-label tab-spacing-2">
                <span class="tab-text-rotator">BLOG DOCK</span>
            </div>
        </div>

    </div>
</template>


<style scoped>
/* ==========================================================================
   1. Base Core Workspace Layout Constraints
   ========================================================================== */
.split-view-master-canvas {
    display: flex;
    position: relative;
    width: 100%;
    height: calc(100vh - 140px);
    overflow: hidden;
    background-color: var(--bg-color);
    transition: var(--transition-smooth);
}

.center-workspace-window {
    flex: 1;
    padding: 0 40px;
    position: relative;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.center-workspace-window::-webkit-scrollbar {
    display: none;
}

.sidebar-edge-cluster {
    position: relative;
    width: 56px;
    height: 100%;
    flex-shrink: 0;
    background-color: var(--bg-color);
    z-index: 20;
}

.vertical-side-label {
    position: absolute;
    width: 56px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background-color: var(--bg-color);
    box-shadow: var(--neomorphic-flat);
    transition: var(--transition-smooth);
}

.vertical-side-label:active {
    box-shadow: var(--neomorphic-inset);
}

.left-edge-cluster .vertical-side-label {
    left: 0;
    border-radius: 0 12px 12px 0;
}

.right-edge-cluster .vertical-side-label {
    right: 0;
    border-radius: 12px 0 0 12px;
}

.tab-spacing-1 {
    top: 40px;
}

.tab-spacing-2 {
    top: 220px;
}

.tab-text-rotator {
    display: block;
    transform: rotate(-90deg);
    white-space: nowrap;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
    color: var(--text-color);
    opacity: 0.7;
}

/* ==========================================================================
   2. PIXEL-LOCKED TOP-ALIGNED GRID SYSTEM (Mascot Lock Engine)
   ========================================================================== */
.sketch-dashboard-grid {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 100%;
    gap: 32px;
    align-items: flex-start;
    padding-top: 40px;
}

.mascot-column-wrapper {
    width: 420px;
    max-width: 420px;
    min-width: 420px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-self: flex-start;
}

.brand-mascot-img {
    width: 100%;
    height: auto;
    max-height: calc(100vh - 220px);
    object-fit: contain;
}

.center-menu-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    overflow: visible;
}

.menu-view-slide-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
}

/* Forces full page inner sub views to take up 100% of space inside the Main Area boundaries */
.full-width-main-area-adjust {
    width: 100%;
    height: 100%;
    padding-top: 40px;
}

.neomorphic-panel-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 24px;
    color: var(--text-color);
}

.neomorphic-actions-list-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    padding-bottom: 32px;
}

.neo-action-card-button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-radius: 12px;
    background-color: var(--bg-color);
    box-shadow: var(--neomorphic-flat);
    cursor: pointer;
    transition: var(--transition-smooth);
}

.neo-action-card-button:active {
    box-shadow: var(--neomorphic-inset);
}

.card-left-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.action-bullet-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.bullet-blue {
    background-color: #0077b6;
}

.bullet-orange {
    background-color: #e67e22;
}

.bullet-gold {
    background-color: #f1c40f;
}

.bullet-green {
    background-color: #2ecc71;
}

.action-row-text-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-color);
}

.action-arrow-pointer-icon {
    width: 16px;
    height: 16px;
    color: var(--text-color);
    opacity: 0.4;
    transition: var(--transition-smooth);
}

.neo-action-card-button:hover .action-arrow-pointer-icon {
    opacity: 0.8;
    transform: translateX(4px);
}

/* ==========================================================================
   3. Sub-Form Inline Header Track Formatting
   ========================================================================== */
.inner-panel-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 24px;
}

.flat-panel-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-color);
    margin-bottom: 0;
}

.borderless-back-arrow-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: var(--text-color);
    opacity: 0.5;
    cursor: pointer;
    padding: 6px;
    transition: opacity 0.2s, transform 0.2s;
}

.borderless-back-arrow-btn:hover {
    opacity: 0.9;
    transform: translateX(2px);
}

/* ==========================================================================
   4. Multi-View Slide Transitions Inline Engine
   ========================================================================== */
.slide-horizontal-enter-active,
.slide-horizontal-leave-active {
    transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-horizontal-enter-from {
    opacity: 0;
    transform: translateX(40px);
}

.slide-horizontal-leave-to {
    opacity: 0;
    transform: translateX(-40px);
}

/* ==========================================================================
   5. Smartphone Responsive Engine (Mobile Breakpoints Reset Matrix)
   ========================================================================== */
@media (max-width: 768px) {
    .split-view-master-canvas {
        height: auto;
        min-height: calc(100vh - 140px);
        flex-direction: column;
    }

    .sidebar-edge-cluster,
    .mascot-column-wrapper {
        display: none;
    }

    .center-workspace-window {
        padding: 24px 16px;
    }

    .sketch-dashboard-grid {
        flex-direction: column;
        gap: 16px;
    }

    .center-menu-column,
    .neomorphic-actions-list-container,
    .vertical-stack-form,
    .inner-panel-header-row {
        width: 100%;
        max-width: 100%;
    }
}
</style>
