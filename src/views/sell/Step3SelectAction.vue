<script setup lang="ts">
// Accept the active operation mode from the parent to persist visual selections
const props = defineProps<{
    operationMode: 'NEW' | 'EXISTING' | null;
}>();

const emit = defineEmits<{
    (e: 'action-selected', payload: { mode: 'NEW'; advertisementId: null }): void;
}>();

const handleCreateNewListing = () => {
    emit('action-selected', {
        mode: 'NEW',
        advertisementId: null
    });
};
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone animate-fade-in">

        <div class="universal-view-header-row"
            style="flex-direction: column; align-items: flex-start; margin-bottom: 12px;">
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text-color); margin: 0;">
                Select Advertisement Path
            </h3>
            <p style="font-size: 12px; color: var(--text-color); opacity: 0.5; margin: 4px 0 0 0;">
                Click the action tile below to initialize a blank property config matrix and launch the listing creation
                wizard.
            </p>
        </div>

        <div class="ad-tiles-flex-grid">
            <!-- Appends active state indicator style if user comes back -->
            <div class="ad-action-tile blank-add-tile-modifier"
                :class="{ 'is-active-tile': props.operationMode === 'NEW' }" @click="handleCreateNewListing">
                <div class="tile-icon-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                        style="width: 18px; height: 18px;">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
                <div class="tile-content-block">
                    <span class="tile-main-heading">Create Fresh Listing</span>
                    <span class="tile-sub-caption">Publish a new property configuration</span>
                </div>
            </div>

        </div>

    </div>
</template>

<style scoped>
.ad-tiles-flex-grid {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-top: 8px;
}

.ad-action-tile {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 420px;
    height: 84px;
    padding: 0 18px;
    border-radius: 12px;
    cursor: pointer;
    user-select: none;
    background-color: var(--bg-color);
    box-shadow: var(--neomorphic-flat, 0 1px 3px rgba(0, 0, 0, 0.02));
    transition: var(--transition-smooth, all 0.3s ease);
}

.blank-add-tile-modifier {
    border: 2px dashed rgba(0, 0, 0, 0.15);
}

[data-theme="dark"] .blank-add-tile-modifier {
    border: 2px dashed rgba(255, 255, 255, 0.15);
}

/* 🌟 Visual active highlighting rules if selected */
.is-active-tile {
    border: 2px solid var(--accent-color) !important;
    background-color: rgba(0, 118, 223, 0.03);
}

[data-theme="dark"] .is-active-tile {
    background-color: rgba(0, 118, 223, 0.08);
}

.blank-add-tile-modifier:hover {
    border-color: var(--accent-color);
    transform: translateY(-0.5px);
}

.ad-action-tile:active {
    transform: scale(0.99);
}

.tile-icon-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    flex-shrink: 0;
    background-color: var(--text-color);
    color: var(--bg-color);
    opacity: 0.9;
    transition: var(--transition-smooth);
}

/* Forces avatar highlight color if active */
.is-active-tile .tile-icon-avatar,
.ad-action-tile:hover .tile-icon-avatar {
    background-color: var(--accent-color);
    color: #ffffff;
    opacity: 1;
}

.tile-content-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tile-main-heading {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-color);
}

.tile-sub-caption {
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text-color);
    opacity: 0.5;
}
</style>
