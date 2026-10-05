<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDarkMode = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  const theme = isDarkMode.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}
</script>

<template>
  <header class="main-header">
    <div class="logo-area">
      <img src="/logo.png" alt="Houseilla Logo" class="brand-logo-metallic">
    </div>

    <div class="header-controls">
      <a href="tel:+918777365360" class="phone-link" title="Phone Button">
        <svg class="header-svg-vector" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span>8777365360</span>
      </a>

      <button @click="toggleTheme" class="theme-toggle-switch" :class="{ 'is-active': isDarkMode }"
        aria-label="Toggle Theme">
        <div class="track-icons">
          <!-- Sun Icon -->
          <svg class="icon-svg icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <!-- Moon Icon -->
          <svg class="icon-svg icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </div>
        <span class="switch-nob"></span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  width: 100%;
  background-color: var(--bg-color);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: var(--transition-smooth);
}

[data-theme="dark"] .main-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.logo-area {
  display: flex;
  align-items: center;
}

.brand-logo-metallic {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.phone-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 700;
  font-size: 13px;
  background-color: var(--bg-color);
  box-shadow: var(--neomorphic-flat);
  border-radius: 10px;
  white-space: nowrap;
  transition: var(--transition-smooth);
}

.phone-link:active {
  box-shadow: var(--neomorphic-inset);
}

.header-svg-vector {
  width: 13px;
  height: 13px;
  color: var(--text-color);
  opacity: 0.8;
}

/* Theme Toggle Matrix */
.theme-toggle-switch {
  position: relative;
  width: 64px;
  height: 32px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  background-color: var(--bg-color);
  box-shadow: var(--neomorphic-inset);
  display: flex;
  align-items: center;
  padding: 3px;
}

.track-icons {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.icon-svg {
  width: 13px;
  height: 13px;
  color: var(--text-color);
  opacity: 0.25;
  transition: opacity 0.3s ease;
}

.theme-toggle-switch:not(.is-active) .icon-sun,
.theme-toggle-switch.is-active .icon-moon {
  opacity: 0.7;
}

.switch-nob {
  position: relative;
  z-index: 2;
  display: block;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f4f6f9;
  box-shadow: 2px 2px 5px rgba(166, 180, 200, 0.7), -1px -1px 4px rgba(255, 255, 255, 1);
  transform: translateX(0);
  transition: var(--transition-smooth);
}

.theme-toggle-switch.is-active .switch-nob {
  transform: translateX(32px);
  background: #2a3543;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.6), -1px -1px 2px rgba(255, 255, 255, 0.12);
}

@media (max-width: 600px) {
  .main-header {
    padding: 10px 16px;
  }

  .header-controls {
    gap: 12px;
  }

  .phone-link {
    padding: 6px 10px;
  }

  .phone-link span {
    display: none;
  }

  .header-svg-vector {
    width: 12px;
    height: 12px;
  }
}
</style>
