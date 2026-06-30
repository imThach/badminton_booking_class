import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate', // Tự động cập nhật khi có nội dung mới
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Badminton Booking App',
                short_name: 'BBA',
                description: 'App for booking badminton classes',
                background_color: '#ffffff',
                theme_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-192.png', // Bạn phải chuẩn bị icon này trong thư mục public
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512.png', // Bạn phải chuẩn bị icon này trong thư mục public
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable' // Quan trọng cho icon trên Android
                    }
                ]
            }
        })
    ],
});