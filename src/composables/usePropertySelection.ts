import { ref, computed } from 'vue';
import type { Advertisement } from '../models/advertisement';

const STORAGE_KEY = 'houseilla_selected_properties_v1';
export const MAX_COMPARE_ITEMS = 4;

const loadInitialSelection = (): Record<number, Advertisement> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Advertisement[];
        if (!Array.isArray(parsed)) return {};
        return parsed.reduce<Record<number, Advertisement>>((acc, item) => {
            if (item && typeof item.id === 'number') {
                acc[item.id] = item;
            }
            return acc;
        }, {});
    } catch {
        return {};
    }
};

// Shared reactive state across PropertyListingView, Premium, Verified, and CompareView
const selectedMap = ref<Record<number, Advertisement>>(loadInitialSelection());

const persistSelection = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.values(selectedMap.value)));
    } catch {
        // Ignore storage quota errors
    }
};

export function usePropertySelection() {
    const selectedListings = computed<Advertisement[]>(() => Object.values(selectedMap.value));
    const selectedIds = computed<number[]>(() => selectedListings.value.map((item) => item.id));
    const selectedCount = computed<number>(() => selectedListings.value.length);

    const isSelected = (id: number): boolean => Boolean(selectedMap.value[id]);

    const toggleSelectListing = (item: Advertisement) => {
        if (selectedMap.value[item.id]) {
            const next = { ...selectedMap.value };
            delete next[item.id];
            selectedMap.value = next;
        } else {
            selectedMap.value = {
                ...selectedMap.value,
                [item.id]: item
            };
        }
        persistSelection();
    };

    const selectSingleListing = (item: Advertisement) => {
        if (!selectedMap.value[item.id]) {
            selectedMap.value = {
                ...selectedMap.value,
                [item.id]: item
            };
            persistSelection();
        }
    };

    const clearSelectedListings = () => {
        selectedMap.value = {};
        persistSelection();
    };

    return {
        selectedListings,
        selectedIds,
        selectedCount,
        isSelected,
        toggleSelectListing,
        selectSingleListing,
        clearSelectedListings
    };
}
