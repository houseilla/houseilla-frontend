<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { AdvertisementImage } from '../models/advertisement';

const props = withDefaults(
    defineProps<{
        media?: AdvertisementImage[];
        altText?: string;
        height?: string;
        showThumbnails?: boolean;
        placeholderLabel?: string;
        fitMode?: 'contain' | 'cover';
    }>(),
    {
        media: () => [],
        altText: 'Property Media',
        height: '420px',
        showThumbnails: false,
        placeholderLabel: 'No Photos Uploaded',
        fitMode: 'contain'
    }
);

const currentIndex = ref(0);

watch(
    () => props.media,
    () => {
        currentIndex.value = 0;
    }
);

const totalItems = computed(() => props.media.length);

const activeItem = computed<AdvertisementImage | null>(() => {
    if (totalItems.value === 0) return null;
    return props.media[currentIndex.value] || props.media[0] || null;
});

const buildSrc = (item: AdvertisementImage): string => {
    const raw = item.base64Data || item.file || '';
    if (!raw) return '';
    if (raw.startsWith('data:')) return raw;
    return `data:${item.type || 'image/jpeg'};base64,${raw}`;
};

const isVideo = (item: AdvertisementImage | null): boolean => {
    return Boolean(item?.type?.startsWith('video/'));
};

const prevSlide = () => {
    if (totalItems.value <= 1) return;
    currentIndex.value = (currentIndex.value - 1 + totalItems.value) % totalItems.value;
};

const nextSlide = () => {
    if (totalItems.value <= 1) return;
    currentIndex.value = (currentIndex.value + 1) % totalItems.value;
};

const goToSlide = (index: number) => {
    currentIndex.value = index;
};
</script>

<template>
    <div class="reusable-slider-wrapper">
        <!-- Main Viewport -->
        <div class="reusable-slider-viewport" :style="{ height }">
            <template v-if="activeItem && buildSrc(activeItem)">
                <video v-if="isVideo(activeItem)" :src="buildSrc(activeItem)" controls class="reusable-slider-media"
                    :style="{ objectFit: fitMode }" @click.stop />
                <img v-else :src="buildSrc(activeItem)" :alt="activeItem.name || altText" class="reusable-slider-media"
                    :style="{ objectFit: fitMode }" />


                <!-- Slide Counter Badge -->
                <span v-if="totalItems > 1" class="reusable-slider-counter">
                    {{ currentIndex + 1 }} / {{ totalItems }}
                </span>

                <!-- Prev / Next Navigation Arrows -->
                <button v-if="totalItems > 1" type="button" class="reusable-slider-arrow is-prev" title="Previous image"
                    @click.stop="prevSlide">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                <button v-if="totalItems > 1" type="button" class="reusable-slider-arrow is-next" title="Next image"
                    @click.stop="nextSlide">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>

                <!-- Pagination Dots -->
                <div v-if="totalItems > 1" class="reusable-slider-dots" @click.stop>
                    <button v-for="(_, idx) in media" :key="idx" type="button" class="reusable-slider-dot"
                        :class="{ 'is-active': idx === currentIndex }" :aria-label="`Slide ${idx + 1}`"
                        @click.stop="goToSlide(idx)" />
                </div>
            </template>

            <!-- Dummy Placeholder When No Image Exists -->
            <div v-else class="reusable-slider-dummy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                    class="reusable-dummy-icon">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span class="reusable-dummy-title">{{ placeholderLabel }}</span>
                <span class="reusable-dummy-sub">HouseiLLA Verified Listing</span>
            </div>
        </div>

        <!-- Optional Thumbnail Strip (Used on Detail View) -->
        <div v-if="showThumbnails && totalItems > 1" class="reusable-slider-thumbs">
            <button v-for="(item, idx) in media" :key="item.fileId ?? idx" type="button" class="reusable-thumb-btn"
                :class="{ 'is-active': idx === currentIndex }" @click.stop="goToSlide(idx)">
                <img v-if="!isVideo(item) && buildSrc(item)" :src="buildSrc(item)"
                    :alt="item.name || `Thumbnail ${idx + 1}`" class="reusable-thumb-img" />
                <span v-else class="reusable-thumb-video-tag">VIDEO</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.reusable-slider-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.reusable-slider-viewport {
    position: relative;
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    background-color: rgba(15, 23, 42, 0.05);
}

[data-theme="dark"] .reusable-slider-viewport {
    background-color: rgba(255, 255, 255, 0.05);
}

.reusable-slider-media {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.reusable-slider-counter {
    position: absolute;
    bottom: 12px;
    right: 12px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    background-color: rgba(15, 23, 42, 0.68);
    color: #ffffff;
    backdrop-filter: blur(4px);
    z-index: 3;
}

.reusable-slider-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background-color: rgba(15, 23, 42, 0.6);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 3;
    transition: background-color 0.18s ease, transform 0.18s ease;
}

.reusable-slider-arrow:hover {
    background-color: var(--accent-color);
    transform: translateY(-50%) scale(1.06);
}

.reusable-slider-arrow.is-prev {
    left: 12px;
}

.reusable-slider-arrow.is-next {
    right: 12px;
}

.reusable-slider-dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background-color: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    z-index: 3;
}

.reusable-slider-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background-color: rgba(255, 255, 255, 0.55);
    cursor: pointer;
    transition: transform 0.18s ease, background-color 0.18s ease;
}

.reusable-slider-dot.is-active {
    background-color: #ffffff;
    transform: scale(1.25);
}

.reusable-slider-dummy {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--text-color);
    opacity: 0.45;
    user-select: none;
}

.reusable-dummy-icon {
    width: 44px;
    height: 44px;
}

.reusable-dummy-title {
    font-size: 13.5px;
    font-weight: 700;
}

.reusable-dummy-sub {
    font-size: 11.5px;
    font-weight: 600;
    opacity: 0.75;
}

.reusable-slider-thumbs {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 2px;
}

.reusable-thumb-btn {
    width: 78px;
    height: 56px;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid transparent;
    padding: 0;
    background-color: rgba(15, 23, 42, 0.06);
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color 0.18s ease, opacity 0.18s ease;
    opacity: 0.75;
}

.reusable-thumb-btn.is-active,
.reusable-thumb-btn:hover {
    border-color: var(--accent-color);
    opacity: 1;
}

.reusable-thumb-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.reusable-thumb-video-tag {
    font-size: 10.5px;
    font-weight: 800;
    color: var(--text-color);
}
</style>
