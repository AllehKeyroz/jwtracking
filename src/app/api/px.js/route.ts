import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // O script dinâmico God Mode Tracker
    // 1. Pega Fingerprint via Canvas/WebGL sutilmente
    // 2. Extrai parâmetros da URL (fbclid, gclid, utm_)
    // 3. Manda um POST para nossa API /api/trc/collect
    // 4. Salva Cookie First-Party

    const scriptContent = `
    (function(window, document) {
      if(window.__KDSTrackerInitialized) return;
      window.__KDSTrackerInitialized = true;

      const API_ENDPOINT = "/api/trc/collect";

      // --- Fingerprint Minimalista WebGL/Canvas Hash ---
      async function getDeviceHash() {
        return new Promise((resolve) => {
          try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            let gpuVendor = 'Unknown';
            let gpuRenderer = 'Unknown';
            if (gl) {
              const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
              if (debugInfo) {
                gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
              }
            }
            
            const concurrency = navigator.hardwareConcurrency || 1;
            const res = window.screen.width + 'x' + window.screen.height;
            const ua = navigator.userAgent;

            const rawString = gpuRenderer + gpuVendor + concurrency + res + ua;
            
            // Simples FNV-1a Hash 32bit para evitar colisao massiva
            let hash = 2166136261;
            for (let i = 0; i < rawString.length; i++) {
              hash ^= rawString.charCodeAt(i);
              hash = (hash * 16777619) >>> 0;
            }
            resolve(hash.toString(16));
          } catch(e) {
            resolve(Math.random().toString(36).substring(2, 15));
          }
        });
      }

      function getUrlParams() {
        const searchParams = new URLSearchParams(window.location.search);
        let params = {};
        for (const [key, value] of searchParams.entries()) {
          params[key] = value;
        }
        return params;
      }

      function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return match[2];
        return null;
      }

      function setCookie(name, value, days) {
        let expires = "";
        if (days) {
          const date = new Date();
          date.setTime(date.getTime() + (days*24*60*60*1000));
          expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/; secure; samesite=Lax";
      }

      async function triggerTrack() {
        const urlParams = getUrlParams();
        const hash = await getDeviceHash();

        setCookie('_kds_hash', hash, 30);
        
        let fpId = getCookie('_kds_vid');
        if(!fpId) {
           fpId = 'v1.' + Date.now().toString(36) + '.' + Math.random().toString(36).substring(2);
           setCookie('_kds_vid', fpId, 395); 
        }

        const payload = {
          url: window.location.href,
          referrer: document.referrer,
          hash: hash,
          vid: fpId,
          params: urlParams,
          screen: window.screen.width + 'x' + window.screen.height,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        if (navigator.sendBeacon) {
          navigator.sendBeacon(API_ENDPOINT, JSON.stringify(payload));
        } else {
          fetch(API_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
          });
        }
      }

      // Adicionar Hooks para cliques no WhatsApp
      document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target && target.href && (target.href.includes('wa.me') || target.href.includes('api.whatsapp.com'))) {
          // Aqui fazemos a Inspecao / Identity Bridge Trigger
          const payload = { event: 'WA_CLICK', hash: getCookie('_kds_hash'), url: target.href };
          fetch(API_ENDPOINT + '/event', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
          });
        }
      });

      triggerTrack();

    })(window, document);
  `;

    return new NextResponse(scriptContent, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
    });
}
