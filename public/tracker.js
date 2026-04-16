// =========================================================================
// KDS TRACKER - SCRIPT BASE FIRST-PARTY (O PIXEL)
// =========================================================================
// Este script deve ser acoplado no <head> da Landing Page do cliente.
// Ele rastreará as visitas de página cruas e extrairá o Fingerprint do
// Hardward do usuário (GPU, CPU, Canvas) criando um ID único (Shadow Hash),
// e injetando um Cookie First-Party blindado contra navegadores restritos.
// =========================================================================

(function (window, document) {
    if (window.kdsTrackerInitialized) return;
    window.kdsTrackerInitialized = true;

    const TRACKER_ENDPOINT = 'http://localhost:3000/api/t'; // Vai mudar em produção
    const COOKIE_NAME = '_kds_id';

    // 1. Ferramentas de Hash e UUID
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const hashString = async (str) => {
        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex.slice(0, 16); // Hash rápido de 16 caracteres
    };

    // 2. Cookie Engine First-Party (Bypass básico de Safari ITP usando Duração longa local)
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    const setCookie = (name, value, days = 395) => {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        let expires = `expires=${d.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
    };

    // 3. Extrator de Device Fingerprint Customizado (WebGL + Tela)
    const getHardwareHashString = () => {
        const nav = window.navigator || {};
        const screen = window.screen || {};

        let gpuVendor = 'Unknown';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                gpuVendor = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        } catch (e) { }

        const rawData = [
            nav.userAgent,
            nav.language,
            nav.hardwareConcurrency,
            nav.deviceMemory,
            `${screen.width}x${screen.height}x${screen.colorDepth}`,
            nav.platform,
            new Date().getTimezoneOffset(),
            gpuVendor
        ].join('|');

        return { rawData, gpuVendor, resolution: `${screen.width}x${screen.height}` };
    };

    // 4. Extrator de Parâmetros de Campanhas (Click IDs e UTMs)
    const getUrlParams = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            fbclid: urlParams.get('fbclid') || null,
            gclid: urlParams.get('gclid') || null,
            utm_source: urlParams.get('utm_source') || null,
            utm_campaign: urlParams.get('utm_campaign') || null,
            utm_medium: urlParams.get('utm_medium') || null,
            workspace_key: document.currentScript?.getAttribute('data-workspace') || 'DEV_WORKSPACE'
        };
    };

    // 5. Motor Principal: Captura e Dispara para a Base
    const initTrace = async () => {
        try {
            let cookieId = getCookie(COOKIE_NAME);
            if (!cookieId) {
                cookieId = generateUUID();
                setCookie(COOKIE_NAME, cookieId);
            }

            const hardwareData = getHardwareHashString();
            const fingerprintId = await hashString(hardwareData.rawData);
            const campaignData = getUrlParams();

            const payload = {
                cookie_id: cookieId,
                fingerprint_hash: fingerprintId,
                browser_url: window.location.href,
                gpu_vendor: hardwareData.gpuVendor,
                screen_resolution: hardwareData.resolution,
                ...campaignData
            };

            // Disparo via Beacon / Fetch para nosso Central God Mode
            if (window.navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                window.navigator.sendBeacon(TRACKER_ENDPOINT, blob);
            } else {
                fetch(TRACKER_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true
                }).catch(() => { });
            }

            console.log('%c[KDS Tracker] Tracking Iniciado com Sucesso.', 'color: #06b6d4; font-weight: bold;');
        } catch (err) {
            console.error('[KDS Tracker] Falha ao injetar rastreio.', err);
        }
    };

    // Executa ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTrace);
    } else {
        initTrace();
    }
})(window, document);
