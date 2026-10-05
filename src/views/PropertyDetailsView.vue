<script setup lang="ts">
import type { Advertisement } from '../models/advertisement'

// Define incoming singular chosen profile property contract
defineProps<{
    advertisement: Advertisement
}>()
</script>

<template>
    <div class="universal-full-page-main-area-view">

        <!-- Placeholder Un-styled readout text sheets block layer to confirm standalone canvas page activation -->
        <div style="border: 2px dashed rgba(0,0,0,0.15); padding: 24px; border-radius: 12px; margin-top: 10px;">
            <h2 style="margin-bottom:12px; font-weight: 800;">{{ advertisement.name }}</h2>
            <p style="margin-bottom:16px; opacity:0.7; font-size:14px; line-height:1.6;">{{ advertisement.description }}
            </p>

            <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px; font-size: 13.5px;">
                <li><strong>Property ID:</strong> #{{ advertisement.advertisementId }}</li>
                <li><strong>Location Area Segment:</strong> {{ advertisement.areaName }}, {{ advertisement.location }}
                </li>
                <li><strong>Financial Valuation:</strong> ₹{{ advertisement.price !== undefined ? (advertisement.price /
                    100000).toFixed(1) : '0.0' }} Lakh</li>
                <li><strong>Contact Phone:</strong> {{ advertisement.phone }}</li>
                <li><strong>Advertiser Email Link:</strong> {{ advertisement.email }}</li>
            </ul>
        </div>

    </div>
</template>
