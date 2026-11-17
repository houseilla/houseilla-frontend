<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { advertisementService } from '../../../../services/advertisementService';
import { SessionKey } from '../../../../models/sellWizardEnums';
import {
    AdvertisementStatus,
    getPropertyTypeLabel,
    AdvertisementPurposeLabels
} from '../../../../models/advertisementEnums';
import type { Advertisement, AdvertisementImage } from '../../../../models/advertisement';

interface MediaTileItem {
    localKey: string;
    fileId?: number;
    label: string;
    type: string;
    rawBase64?: string;
    previewUrl: string;
    isExisting: boolean;
}

const emit = defineEmits<{
    (e: 'listing-published', publishedAd: Advertisement): void;
    (e: 'start-new-listing'): void;
}>();

const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

const activeAdvertisement = ref<Advertisement | null>(null);
const mediaItems = ref<MediaTileItem[]>([]);
const previewModalItem = ref<MediaTileItem | null>(null);

const isLoadingExisting = ref<boolean>(false);
const isProcessingFiles = ref<boolean>(false);
const isPublishing = ref<boolean>(false);
const isPublished = ref<boolean>(false);
const isDragging = ref<boolean>(false);

const errorMessage = ref<string>('');
const fileInputRef = ref<HTMLInputElement | null>(null);

const photoCount = computed(() => mediaItems.value.filter((m) => m.type.startsWith('image/')).length);
const videoCount = computed(() => mediaItems.value.filter((m) => m.type.startsWith('video/')).length);

const stripFileExtension = (filename: string): string => {
    return filename.replace(/\.[^/.]+$/, '').trim();
};

onMounted(async () => {
    const cachedAd = sessionStorage.getItem(SessionKey.ADVERTISEMENT);
    if (cachedAd) {
        activeAdvertisement.value = JSON.parse(cachedAd);
    }

    if (activeAdvertisement.value?.id) {
        isLoadingExisting.value = true;
        try {
            const existing = await advertisementService.getAdvertisementImages(activeAdvertisement.value.id);
            mediaItems.value = (existing || [])
                .filter((item) => Boolean(item.base64Data))
                .map((item, idx) => ({
                    localKey: `existing-${item.fileId ?? idx}`,
                    fileId: item.fileId,
                    label: item.name || `Photo ${idx + 1}`,
                    type: item.type || 'image/jpeg',
                    previewUrl: item.base64Data!,
                    isExisting: true
                }));
        } catch (err) {
            errorMessage.value = 'Could not load previously uploaded media. You can still add new files below.';
        } finally {
            isLoadingExisting.value = false;
        }
    }
});
const compressImageToBase64 = (file: File): Promise<{ rawBase64: string; previewUrl: string; type: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const maxDimension = 1280;
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context unavailable'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const outputType = 'image/jpeg';
                const dataUrl = canvas.toDataURL(outputType, 0.8);
                const rawBase64 = dataUrl.split(',')[1] || '';
                resolve({ rawBase64, previewUrl: dataUrl, type: outputType });
            };
            img.onerror = () => reject(new Error(`Unable to decode image ${file.name}`));
            img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error(`Failed reading ${file.name}`));
        reader.readAsDataURL(file);
    });
};

const readVideoToBase64 = (file: File): Promise<{ rawBase64: string; previewUrl: string; type: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const rawBase64 = dataUrl.split(',')[1] || '';
            resolve({ rawBase64, previewUrl: dataUrl, type: file.type || 'video/mp4' });
        };
        reader.onerror = () => reject(new Error(`Failed reading video ${file.name}`));
        reader.readAsDataURL(file);
    });
};

const processSelectedFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    errorMessage.value = '';
    isProcessingFiles.value = true;

    try {
        for (const file of Array.from(fileList)) {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type === 'video/mp4' || file.type === 'video/webm';

            if (!isImage && !isVideo) {
                errorMessage.value = `"${file.name}" is unsupported. Use JPG, PNG, WebP or MP4/WebM video.`;
                continue;
            }

            if (isImage) {
                if (photoCount.value >= MAX_PHOTOS) {
                    errorMessage.value = `Maximum ${MAX_PHOTOS} photos allowed per property listing.`;
                    continue;
                }
                if (file.size > MAX_PHOTO_BYTES) {
                    errorMessage.value = `"${file.name}" exceeds the 5 MB photo size limit.`;
                    continue;
                }

                const compressed = await compressImageToBase64(file);
                mediaItems.value.push({
                    localKey: `new-img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    label: '',
                    type: compressed.type,
                    rawBase64: compressed.rawBase64,
                    previewUrl: compressed.previewUrl,
                    isExisting: false
                });

            } else if (isVideo) {
                if (videoCount.value >= 1) {
                    errorMessage.value = 'Only 1 short walkthrough video is allowed per listing.';
                    continue;
                }
                if (file.size > MAX_VIDEO_BYTES) {
                    errorMessage.value = `"${file.name}" exceeds the 10 MB short video limit.`;
                    continue;
                }

                const videoPayload = await readVideoToBase64(file);
                mediaItems.value.push({
                    localKey: `new-vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    label: '',
                    type: videoPayload.type,
                    rawBase64: videoPayload.rawBase64,
                    previewUrl: videoPayload.previewUrl,
                    isExisting: false
                });

            }
        }
    } catch (err: any) {
        errorMessage.value = err.message || 'Failed to process selected media files.';
    } finally {
        isProcessingFiles.value = false;
        if (fileInputRef.value) {
            fileInputRef.value.value = '';
        }
    }
};

const handleFileDrop = (event: DragEvent) => {
    isDragging.value = false;
    processSelectedFiles(event.dataTransfer?.files || null);
};

const removeMediaItem = async (index: number) => {
    const target = mediaItems.value[index];
    if (!target) return;
    errorMessage.value = '';

    if (target.isExisting && target.fileId) {
        try {
            await advertisementService.deleteAdvertisementImage(target.fileId);
        } catch (err) {
            errorMessage.value = 'Failed to delete media item from server. Please try again.';
            return;
        }
    }

    if (previewModalItem.value?.localKey === target.localKey) {
        previewModalItem.value = null;
    }

    mediaItems.value.splice(index, 1);
};

const handlePublishListing = async () => {
    errorMessage.value = '';

    if (!activeAdvertisement.value || !activeAdvertisement.value.id) {
        errorMessage.value = 'Missing valid Advertisement ID. Please complete earlier steps first.';
        return;
    }

    const adId = activeAdvertisement.value.id;
    isPublishing.value = true;

    try {
        const pendingUploads: AdvertisementImage[] = mediaItems.value
            .filter((item) => !item.isExisting && item.rawBase64)
            .map((item, idx) => ({
                advertisementId: adId,
                name: item.label.trim() || `Property Media ${idx + 1}`,
                type: item.type,
                file: item.rawBase64
            }));

        if (pendingUploads.length > 0) {
            const savedRecords = await advertisementService.uploadAdvertisementImages(adId, pendingUploads);
            let savedCursor = 0;
            mediaItems.value = mediaItems.value.map((item) => {
                if (!item.isExisting) {
                    const saved = savedRecords[savedCursor++];
                    return {
                        ...item,
                        fileId: saved?.fileId,
                        isExisting: true,
                        rawBase64: undefined
                    };
                }
                return item;
            });
        }

        const existingUpdates = mediaItems.value.filter((item) => item.isExisting && item.fileId);
        for (const item of existingUpdates) {
            await advertisementService.updateAdvertisementImageLabel(
                item.fileId!,
                item.label.trim() || 'Property Media'
            );
        }


        const updatedAdPayload: Advertisement = {
            ...activeAdvertisement.value,
            listingStatus: AdvertisementStatus.ACTIVE
        };

        const publishedRecord = await advertisementService.saveAdvertisementListing(adId, updatedAdPayload);
        activeAdvertisement.value = publishedRecord;
        sessionStorage.setItem(SessionKey.ADVERTISEMENT, JSON.stringify(publishedRecord));

        isPublished.value = true;
        emit('listing-published', publishedRecord);
    } catch (err: any) {
        errorMessage.value =
            err.response?.data?.message || 'Failed to publish advertisement. Please try again.';
    } finally {
        isPublishing.value = false;
    }


};
</script>

<template>
    <div class="vertical-stack-form shadow-clipping-safe-zone animate-fade-in">

        <!-- PUBLISHED CONFIRMATION SUMMARY CARD -->
        <div v-if="isPublished && activeAdvertisement"
            class="neomorphic-card-base published-summary-box animate-fade-in">
            <div class="published-check-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"
                    stroke-linejoin="round" style="width: 24px; height: 24px;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>

            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-color);">
                Property Listing Published!
            </h3>
            <p style="font-size: 12.5px; color: var(--text-color); opacity: 0.65;">
                Your advertisement is now <strong>Active</strong> and live for buyers and tenants.
            </p>

            <div class="published-details-list">
                <div class="published-detail-row">
                    <span class="detail-key">Listing ID</span>
                    <span class="detail-val">#{{ activeAdvertisement.id }}</span>
                </div>
                <div class="published-detail-row">
                    <span class="detail-key">Property</span>
                    <span class="detail-val">
                        {{ getPropertyTypeLabel(activeAdvertisement.propertyType) }}
                        {{ AdvertisementPurposeLabels[activeAdvertisement.purpose] || '' }}
                    </span>
                </div>
                <div class="published-detail-row">
                    <span class="detail-key">Location</span>
                    <span class="detail-val">
                        {{ [activeAdvertisement.areaName, activeAdvertisement.district,
                        activeAdvertisement.pincode].filter(Boolean).join(', ') }}
                    </span>
                </div>
                <div class="published-detail-row">
                    <span class="detail-key">Price</span>
                    <span class="detail-val" style="color: var(--accent-color);">
                        ₹ {{ Number(activeAdvertisement.price || 0).toLocaleString('en-IN') }}
                    </span>
                </div>
                <div class="published-detail-row">
                    <span class="detail-key">Media Attached</span>
                    <span class="detail-val">{{ photoCount }} Photo(s), {{ videoCount }} Video</span>
                </div>
            </div>

            <div class="flat-btn-row-wrapper">
                <button type="button" class="flat-full-width-action-btn" @click="emit('start-new-listing')">
                    <span class="btn-label-text">Manage Listings or Post Another Property</span>
                </button>
            </div>
        </div>

        <!-- MEDIA TILE GRID VIEW -->
        <template v-else>
            <div class="universal-view-header-row"
                style="flex-direction: column; align-items: flex-start; margin-bottom: 4px;">
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-color); margin: 0;">
                    Property Photos & Short Video (Optional)
                </h3>
                <p style="font-size: 12px; color: var(--text-color); opacity: 0.5; margin: 4px 0 0 0;">
                    Add up to {{ MAX_PHOTOS }} photos (max 5 MB each) and 1 short video (max 10 MB). Label each room or
                    click a tile to preview.
                </p>
            </div>

            <input ref="fileInputRef" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                style="display: none;" @change="processSelectedFiles(($event.target as HTMLInputElement).files)" />

            <div class="tiles-three-col-grid">
                <!-- TILE 1: ADD IMAGE / VIDEO -->
                <div class="shared-grid-tile is-dashed-add-tile step7-card-dims"
                    :class="{ 'is-drag-active': isDragging }" @dragover.prevent="isDragging = true"
                    @dragleave.prevent="isDragging = false" @drop.prevent="handleFileDrop"
                    @click="fileInputRef?.click()">
                    <div class="tile-center-stack">
                        <div class="tile-icon-avatar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                                style="width: 18px; height: 18px;">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                        <span class="tile-main-heading">
                            {{ isProcessingFiles ? 'Processing...' : 'Add Image / Video' }}
                        </span>
                        <span class="tile-sub-caption">
                            Photos: {{ photoCount }}/{{ MAX_PHOTOS }} • Video: {{ videoCount }}/1
                        </span>
                    </div>
                </div>
                <!-- LOADING TILE -->
                <div v-if="isLoadingExisting" class="shared-grid-tile is-loading-tile step7-card-dims">
                    <span class="tile-sub-caption">Loading existing media...</span>
                </div>

                <!-- TILES 2..N: UPLOADED MEDIA THUMBNAIL CARDS -->
                <div v-else v-for="(item, idx) in mediaItems" :key="item.localKey"
                    class="shared-grid-tile is-solid-item-tile step7-card-dims" style="gap: 8px;"
                    @click="previewModalItem = item">

                    <div class="tile-media-frame">
                        <img v-if="item.type.startsWith('image/')" :src="item.previewUrl" :alt="item.label"
                            class="tile-media-cover" />
                        <video v-else :src="item.previewUrl" muted playsinline class="tile-media-cover"></video>

                        <span class="media-type-pill" :class="{ 'is-cover-pill': idx === 0 }">
                            {{ item.type.startsWith('video/') ? '▶ Video' : idx === 0 ? 'Cover' : `#${idx + 1}` }}
                        </span>

                        <button type="button" class="card-delete-icon-btn tile-delete-overlay" title="Remove Media"
                            @click.stop="removeMediaItem(idx)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                                stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                                <path d="M10 11v6"></path>
                                <path d="M14 11v6"></path>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="flat-form-field tile-name-input-box" @click.stop>
                        <input v-model="item.label" type="text" class="flat-raw-input"
                            style="padding-left: 0; font-size: 12.5px;" placeholder="Label (e.g. Bedroom 1, Kitchen)" />
                    </div>

                </div>
            </div>

            <div v-if="errorMessage" class="filter-vertical-row remove-bottom-gap">
                <span class="flat-error-descriptor-text shake-error-cue">{{ errorMessage }}</span>
            </div>

            <div class="flat-btn-row-wrapper">
                <button type="button" class="flat-full-width-action-btn" :disabled="isPublishing || isProcessingFiles"
                    @click="handlePublishListing">
                    <svg class="flat-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span class="btn-label-text">
                        {{
                            isPublishing
                                ? 'Publishing Listing...'
                                : mediaItems.length > 0
                                    ? 'Save Media & Publish Listing'
                                    : 'Skip Media & Publish Listing'
                        }}
                    </span>
                </button>
            </div>
        </template>

        <!-- QUICK PREVIEW MODAL -->
        <div v-if="previewModalItem" class="media-preview-backdrop" @click="previewModalItem = null">
            <div class="neomorphic-card-base media-preview-dialog animate-fade-in" @click.stop>
                <div class="preview-dialog-header">
                    <span class="tile-main-heading" style="font-size: 14px;">
                        {{ previewModalItem.label || 'Media Preview' }}
                    </span>
                    <button type="button" class="preview-close-btn" @click="previewModalItem = null"
                        aria-label="Close preview">
                        ✕
                    </button>
                </div>

                <div class="preview-dialog-body">
                    <img v-if="previewModalItem.type.startsWith('image/')" :src="previewModalItem.previewUrl"
                        :alt="previewModalItem.label" class="preview-full-media" />
                    <video v-else :src="previewModalItem.previewUrl" controls autoplay playsinline
                        class="preview-full-media"></video>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.step7-card-dims {
    min-height: 178px;
    padding: 10px;
}

.tile-media-frame {
    position: relative;
    width: 100%;
    height: 116px;
    border-radius: 8px;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.05);
}

.tile-media-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.media-type-pill {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background-color: rgba(15, 23, 42, 0.75);
    color: #ffffff;
}

.media-type-pill.is-cover-pill {
    background-color: #2ecc71;
}

.tile-delete-overlay {
    position: absolute;
    top: 8px;
    right: 8px;
}

.tile-name-input-box {
    height: 36px;
    border-radius: 8px;
    padding: 0 10px;
}

.media-preview-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(15, 23, 42, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 10000;
}

.media-preview-dialog {
    width: 100%;
    max-width: 680px;
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 1.5px solid rgba(255, 255, 255, 0.15);
}

.preview-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
}

.preview-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: none;
    background-color: rgba(0, 0, 0, 0.08);
    color: var(--text-color);
    font-weight: 700;
    cursor: pointer;
}

.preview-dialog-body {
    width: 100%;
    max-height: 70vh;
    border-radius: 10px;
    overflow: hidden;
    background-color: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-full-media {
    width: 100%;
    max-height: 70vh;
    object-fit: contain;
}

.published-summary-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    padding: 24px 18px;
    border-radius: 14px;
    border: 1.5px solid rgba(46, 204, 113, 0.35);
}

.published-check-badge {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #2ecc71;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.published-details-list {
    width: 100%;
    margin-top: 4px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
}

[data-theme="dark"] .published-details-list {
    border-color: rgba(255, 255, 255, 0.08);
}

.published-detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 12.5px;
    gap: 12px;
}

.detail-key {
    font-weight: 600;
    color: var(--text-color);
    opacity: 0.6;
}

.detail-val {
    font-weight: 700;
    color: var(--text-color);
    text-align: right;
}
</style>
