<script setup lang="ts">
// Script engine remains clean and declarative
</script>

<template>
    <footer class="houseilla-layered-footer">
        <div class="footer-inner-wrapper">
            <div class="footer-primary-interactive-row">
                <!-- Left Cluster Panel: Contact Information Bar -->
                <div class="neomorphic-raised-contact-bar">
                    <a href="mailto:info@houseilla.in" class="contact-dock-anchor" title="Email Us">
                        <svg class="footer-svg-vector" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <span class="contact-string-text">info@houseilla.in</span>
                    </a>
                    <span class="contact-bar-vertical-divider"></span>
                    <a href="tel:+918777365360" class="contact-dock-anchor" title="Call Us">
                        <svg class="footer-svg-vector" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <span class="contact-string-text">+91 8777365360</span>
                    </a>
                </div>

                <!-- Center Sub-Block: Dynamic Legal Nodes Matrix -->
                <div class="footer-center-legal-block">
                    <p class="copyright-flat-text">
                        © 2026 Houseilla Real Estate.
                        <a href="#" class="legal-anchor-node">Privacy Policy</a>
                        <span class="legal-divider">|</span>
                        <a href="#" class="legal-anchor-node">Terms & Conditions</a>
                    </p>
                </div>

                <!-- Right Stack Block: Cleanly Structured 6 Social Channels Matrix -->
                <div class="independent-social-tiles-stack" aria-label="Social Tiles">
                    <!-- 1. WhatsApp (Updated Official Handset Path) -->
                    <a href="https://wa.me" target="_blank" class="squarish-social-tile tile-whatsapp"
                        aria-label="WhatsApp">
                        <svg class="social-svg-vector" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </a>
                    <!-- 2. Instagram -->
                    <a href="#" class="squarish-social-tile tile-instagram" aria-label="Instagram">
                        <svg class="social-svg-vector" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                    </a>
                    <!-- 3. Facebook -->
                    <a href="#" class="squarish-social-tile tile-facebook" aria-label="Facebook">
                        <svg class="social-svg-vector" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </a>
                    <!-- 4. YouTube (Updated Official Rounded Play Button Path) -->
                    <a href="#" class="squarish-social-tile tile-youtube" aria-label="YouTube">
                        <svg class="social-svg-vector" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.933-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </a>
                    <!-- 5. LinkedIn -->
                    <a href="#" class="squarish-social-tile tile-linkedin" aria-label="LinkedIn">
                        <svg class="social-svg-vector" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
                        </svg>
                    </a>
                    <!-- 6. X (Twitter) -->
                    <a href="#" class="squarish-social-tile tile-x" aria-label="X">
                        <svg class="social-svg-vector" viewBox="0 0 24 24" fill="currentColor">
                            <path
                                d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.houseilla-layered-footer {
    width: 100%;
    padding: 12px 48px;
    background-color: var(--bg-color);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    transition: var(--transition-smooth);
}

.footer-inner-wrapper {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
}

.footer-primary-interactive-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
}

.neomorphic-raised-contact-bar {
    display: flex;
    align-items: center;
    background-color: var(--bg-color);
    box-shadow: var(--neomorphic-flat);
    border-radius: 10px;
    padding: 8px 16px;
    gap: 14px;
}

.contact-dock-anchor {
    display: flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    color: var(--text-color);
    font-size: 13px;
    font-weight: 600;
    opacity: 0.85;
    transition: var(--transition-smooth);
}

.contact-dock-anchor:hover {
    opacity: 1;
    color: var(--accent-color);
}

.footer-svg-vector {
    width: 14px;
    height: 14px;
    color: var(--text-color);
    opacity: 0.7;
}

.contact-bar-vertical-divider {
    width: 1px;
    height: 12px;
    background-color: var(--text-color);
    opacity: 0.15;
}

.footer-center-legal-block {
    display: flex;
    align-items: center;
}

.copyright-flat-text {
    font-size: 12px;
    opacity: 0.7;
    margin: 0;
    letter-spacing: 0.2px;
    color: var(--text-color);
}

.legal-divider {
    margin: 0 6px;
    opacity: 0.3;
}

.legal-anchor-node {
    color: var(--text-color);
    text-decoration: none;
    opacity: 0.6;
    font-weight: 500;
    transition: opacity 0.2s ease, color 0.2s ease;
}

/* Hover effect requested: turns vivid brand blue */
.legal-anchor-node:hover {
    opacity: 1;
    color: var(--accent-color) !important;
}

.independent-social-tiles-stack {
    display: flex;
    align-items: center;
    gap: 8px;
}

.squarish-social-tile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: var(--bg-color);
    box-shadow: var(--neomorphic-flat);
    color: var(--text-color);
    opacity: 0.85;
    transition: var(--transition-smooth);
}

.squarish-social-tile:hover {
    transform: translateY(-2px);
    opacity: 1;
}

.squarish-social-tile:active {
    box-shadow: var(--neomorphic-inset);
    transform: translateY(0);
}

.social-svg-vector {
    width: 16px;
    height: 16px;
}

/* Individual Brand Custom Hover Colors */
.tile-whatsapp:hover {
    background-color: #25d366 !important;
    color: #fff !important;
}

.tile-instagram:hover {
    background-color: #e1306c !important;
    color: #fff !important;
}

.tile-facebook:hover {
    background-color: #1877f2 !important;
    color: #fff !important;
}

.tile-youtube:hover {
    background-color: #ff0000 !important;
    color: #fff !important;
}

.tile-linkedin:hover {
    background-color: #0077b5 !important;
    color: #fff !important;
}

.tile-x:hover {
    background-color: #000000 !important;
    color: #fff !important;
}

/* Responsive Adjustments */
@media (max-width: 950px) {
    .houseilla-layered-footer {
        padding: 16px;
    }

    .footer-primary-interactive-row {
        flex-direction: column;
        gap: 14px;
        align-items: center;
    }

    .contact-string-text {
        display: none;
    }

    .neomorphic-raised-contact-bar {
        padding: 10px 20px;
        gap: 20px;
    }

    .independent-social-tiles-stack {
        width: 100%;
        justify-content: center;
        gap: 10px;
    }

    .squarish-social-tile {
        width: 34px;
        height: 34px;
    }
}
</style>
