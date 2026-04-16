'use client';

export function getFingerprint() {
    try {
        const screenRes = `${window.screen.width}x${window.screen.height}`;
        const ratio = window.devicePixelRatio || 1;
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';

        let gpuVendor = 'unknown';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') as WebGLRenderingContext;
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                gpuVendor = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : 'unknown';
            }
        } catch (e) {
            console.warn("WebGL Fingerprint Failed", e);
        }

        // --- MOTOR DE INFERÊNCIA DE MODELO ---
        let deviceModel = "Generic";

        if (/iPhone|iPad|iPod/.test(ua)) {
            const w = window.screen.width * ratio;
            const h = window.screen.height * ratio;
            if (w === 1290 && h === 2796) deviceModel = "iPhone 15/14 Pro Max";
            else if (w === 1179 && h === 2556) deviceModel = "iPhone 15/14 Pro";
            else if (w === 1284 && h === 2778) deviceModel = "iPhone 13/12 Pro Max";
            else if (w === 1170 && h === 2532) deviceModel = "iPhone 14/13/12";
            else if (w === 1242 && h === 2688) deviceModel = "iPhone 11 Pro Max / XS Max";
            else if (w === 828 && h === 1792) deviceModel = "iPhone 11 / XR";
            else if (w === 1125 && h === 2436) deviceModel = "iPhone 11 Pro / X / XS";
            else if (w === 1080 && h === 1920) deviceModel = "iPhone Plus";
            else if (w === 750 && h === 1334) deviceModel = "iPhone SE/8/7";
            else deviceModel = "Apple iPhone";
        } else if (/Android/.test(ua)) {
            const match = ua.match(/Android\s([^\;]+)\;\s([^\;|\)]+)/);
            if (match && match[2]) {
                deviceModel = match[2].trim();
            } else {
                const modelMatch = ua.match(/\s([^;]+)\sBuild\//);
                deviceModel = modelMatch ? modelMatch[1] : "Android Phone";
            }
        } else if (/Windows/.test(ua)) {
            deviceModel = "Windows PC";
        } else if (/Macintosh/.test(ua)) {
            deviceModel = "Mac";
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
        const os = /Android/.test(ua) ? "Android" : (/iPhone|iPad|iPod/.test(ua) ? "iOS" : "Desktop");

        // Hash ultra-seguro e simples
        const safe = (s: any) => String(s || '').replace(/[^a-zA-Z0-9]/g, '');
        const hash = `fp_${safe(gpuVendor).substring(0, 8)}_${safe(screenRes)}_${safe(deviceModel)}`.substring(0, 32);

        return {
            gpuVendor,
            screenResolution: screenRes,
            userAgent: ua,
            os,
            deviceType: isMobile ? "Mobile" : "Desktop",
            deviceModel,
            hash
        };
    } catch (e) {
        return {
            gpuVendor: 'unknown',
            screenResolution: 'unknown',
            userAgent: 'unknown',
            os: 'unknown',
            deviceType: 'Desktop',
            deviceModel: 'Generic',
            hash: 'err_' + Math.random().toString(36).substring(7)
        };
    }
}
