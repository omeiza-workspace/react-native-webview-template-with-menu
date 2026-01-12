// constants/WebViewScripts.ts
import { APP_CONFIG } from '@/config/app';

const appOrigin = new URL(APP_CONFIG.APP_URL).origin;

export const INJECTED_JAVASCRIPT = `
    (function () {
        const appOrigin = "${appOrigin}";
        if (window.location.origin !== appOrigin && window.location.origin !== 'null') return;

        // 1. Clean up old PWA cache (Preserved)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }

        // 2. Define the Bridge (Preserved)
        window.isNativeApp = true;
        window.GEFIX = {
            postMessage: function (data) {
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
        };

        // 3. NEW: Listener for Native -> Web commands
        // This lets React Native trigger your Laravel JS functions
        window.addEventListener('message', function (event) {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'REFRESH_NOTIFICATIONS') {
                    // If you have a function named 'updateBell' on your website, it runs now
                    if (typeof window.updateNotificationBell === 'function') {
                        window.updateNotificationBell();
                    }
                }
            } catch (e) { }
        });

        // 4. Click Interceptor (Preserved)
        document.addEventListener('click', function (e) {
            const a = e.target.closest('a');
            if (a && a.href) {
                const isExternal = !a.href.startsWith(appOrigin);
                const isNewTab = a.target === '_blank';
                if (isExternal || isNewTab) {
                    e.preventDefault();
                    window.GEFIX.postMessage({ type: 'OPEN_EXTERNAL', url: a.href });
                }
            }
        }, true);
    })();
    true;
    `;
