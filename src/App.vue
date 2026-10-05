<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from './views/AppHeader.vue'
import AppFooter from './views/AppFooter.vue'

const isRefreshing = ref(false)
const pullDistance = ref(0)
let startY = 0

const handleTouchStart = (e: TouchEvent) => {
  const scrollableMainBody = document.querySelector('.scrollable-main-body')
  if (scrollableMainBody && scrollableMainBody.scrollTop === 0) {
    if (e.touches && e.touches.length > 0) {
      const primaryTouch = e.touches[0]
      if (primaryTouch && primaryTouch.clientY !== undefined) {
        startY = primaryTouch.clientY
      }
    }
  }
}

const handleTouchMove = (e: TouchEvent) => {
  const scrollableMainBody = document.querySelector('.scrollable-main-body')
  if (startY === 0 || !scrollableMainBody || scrollableMainBody.scrollTop > 0)
    return

  if (e.touches && e.touches.length > 0) {
    const primaryTouch = e.touches[0]
    if (primaryTouch && primaryTouch.clientY !== undefined) {
      const currentY = primaryTouch.clientY
      const distance = currentY - startY

      if (distance > 0) {
        pullDistance.value = Math.min(distance * 0.4, 80)
        if (pullDistance.value > 10 && e.cancelable) {
          e.preventDefault()
        }
      }
    }
  }
}

const handleTouchEnd = () => {
  if (pullDistance.value >= 70) {
    triggerRefresh()
  } else {
    pullDistance.value = 0
  }
  startY = 0
}

const triggerRefresh = () => {
  isRefreshing.value = true
  pullDistance.value = 50
  setTimeout(() => {
    isRefreshing.value = false
    pullDistance.value = 0
    window.location.reload()
  }, 1200)
}
</script>

<template>
  <div class="app-layout-wrapper">
    <!-- Fixed Header Placement Anchor -->
    <header class="fixed-header-pane">
      <AppHeader />
    </header>

    <!-- Visual Pull-To-Refresh Indicator Wrapper Layer -->
    <div class="refresh-indicator" :style="{
      transform: `translateY(${pullDistance}px) translateX(-50%)`,
      opacity: pullDistance > 0 || isRefreshing ? 1 : 0,
      pointerEvents: pullDistance > 0 || isRefreshing ? 'auto' : 'none'
    }">
      <div class="spinner" :class="{ 'spinning': isRefreshing }">
        <!-- SVG Static Arrow icon shown while dragging -->
        <svg v-if="!isRefreshing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <!-- SVG Animated Loading Spinner shown while loading -->
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
      </div>
    </div>

    <!-- The Core Scroll Engine Viewport -->
    <main class="scrollable-main-body shadow-clipping-safe-zone" :style="{ transform: `translateY(${pullDistance}px)` }"
      @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">
      <div class="content-viewport-limiter">
        <RouterView />
      </div>
    </main>

    <!-- Fixed Footer Placement Anchor -->
    <footer class="fixed-footer-pane">
      <AppFooter />
    </footer>
  </div>
</template>

<style scoped>
.app-layout-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.fixed-header-pane,
.fixed-footer-pane {
  flex-shrink: 0;
  z-index: 10;
}

.fixed-footer-pane {
  margin-top: auto;
}

.scrollable-main-body {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background-color: var(--bg-color);
  transition: transform 0.2s cubic-bezier(0.1, 0.8, 0.3, 1);
}

.content-viewport-limiter {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 8px;
}

.refresh-indicator {
  position: absolute;
  top: 70px;
  left: 50%;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-color);
  box-shadow: var(--neomorphic-flat);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.1s linear;
}

.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
}

.spinner.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
