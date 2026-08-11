/// <reference types="vitest" />
import {defineConfig} from 'vitest/config'
import {VitePWA} from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react'
// https://vitejs.dev/config/
export default defineConfig({
    base: "/",
    test: {
        environment: "jsdom",
    },
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            workbox: {
                globPatterns: ["**/*"],
            },
            manifest: {
                name: "Civil42",
                short_name: "Civil42",
                description: "Civil42",
                theme_color: "#FFFFE0",
                icons: [{
                    src: "pwa-64x64.png",
                    sizes: "64x64",
                    type: "image/png",
                }, {
                    src: "pwa-192x192.png",
                    sizes: "192x192",
                    type: "image/png",
                }, {
                    src: "pwa-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                }, {
                    src: "maskable-icon-512x512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                }],
            },
        }),
    ],
})