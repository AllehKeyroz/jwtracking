'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectPage() {
    const params = useParams();
    const [message, setMessage] = useState('Processando redirecionamento...');

    useEffect(() => {
        async function processLink() {
            try {
                const slug = typeof params.slug === 'string' ? params.slug : (Array.isArray(params.slug) ? params.slug[0] : 'unknown');

                let destination = '';
                let workspaceId = '';
                let isAuthTrap = false;
                let authedPhoneStr = '';

                // A. Rota In-App WebView (Micro-Bot)
                if (slug.startsWith('auth-')) {
                    isAuthTrap = true;
                    try {
                        const base64Str = slug.replace('auth-', '');
                        authedPhoneStr = atob(base64Str);
                    } catch (e) { }

                    if (!authedPhoneStr) {
                        setMessage('Link de verificação corrompido.');
                        return;
                    }
                } else {
                    // B. Rota Tradicional de Encurtador (Landing -> WhatsApp)
                    const res = await fetch(`/api/links/${slug}`);
                    if (!res.ok) {
                        setMessage('Link Inválido ou Inativo.');
                        return;
                    }
                    const data = await res.json();
                    destination = data.destination_url;
                    workspaceId = data.workspace_id;
                }

                // 2. Extração Segura de Dados de Dispositivo (Identidade Local do Navegador)
                let finalHash = 'unknown';
                let gpuVendorData = 'Unknown';
                let resScreenData = '0x0';

                try {
                    const canvas = document.createElement('canvas');
                    let gl = null;
                    try {
                        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                    } catch (e) { }

                    if (gl) {
                        const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
                        if (ext) {
                            gpuVendorData = (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_VENDOR_WEBGL);
                        }
                    }
                    const concurrency = navigator.hardwareConcurrency || 1;
                    resScreenData = window.screen.width + 'x' + window.screen.height;
                    const ua = navigator.userAgent;

                    const rawString = gpuVendorData + concurrency + resScreenData + ua;
                    let hash = 2166136261;
                    for (let i = 0; i < rawString.length; i++) {
                        hash ^= rawString.charCodeAt(i);
                        hash = (hash * 16777619) >>> 0;
                    }
                    finalHash = hash.toString(16);
                } catch (e) {
                    console.warn('A extração de detalhes do hardware falhou. Funcionalidade degradada de dispositivo.', e);
                }

                // 3. Extrato e Organização Rápida de Tags de Anúncios e Campanhas
                const searchParams = new URLSearchParams(window.location.search);
                const fbclid = searchParams.get('fbclid');
                const gclid = searchParams.get('gclid');
                const utm_source = searchParams.get('utm_source');
                const utm_campaign = searchParams.get('utm_campaign');

                // 4. Fluxo de Decisão Final
                if (isAuthTrap) {
                    await fetch('/api/t/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fingerprint_hash: finalHash,
                            phone: authedPhoneStr,
                            gpu_vendor: gpuVendorData,
                            screen_resolution: resScreenData,
                        })
                    }).catch(() => { });

                    setMessage('Acesso Liberado! Você já pode voltar ao WhatsApp.');
                    setTimeout(() => {
                        window.close(); // Tenta fechar o In-App Webview
                    }, 2500);

                } else {
                    // Executamos o Rastreamento Primário diretamente na nossa API Node.js/SQLite
                    await fetch('/api/t', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fingerprint_hash: finalHash,
                            gpu_vendor: gpuVendorData,
                            screen_resolution: resScreenData,
                            browser_url: window.location.href,
                            fbclid: fbclid,
                            gclid: gclid,
                            utm_source: utm_source,
                            utm_campaign: utm_campaign,
                            workspace_key: workspaceId // Amarra esse tráfego e lead a este Workspace
                        })
                    }).catch(() => { });

                    // 5. Encaminhamento para a Landing Page Oficial / WhatsApp do nosso Cliente
                    // Mantemos um tempo orgânico minúsculo para a UI parecer natural
                    setMessage('Carregando destino...');
                    setTimeout(() => {
                        window.location.replace(destination);
                    }, 400);
                }

            } catch (err) {
                console.error('Falha de sistema interno do KDS Redirector', err);
                setMessage('Ops! Ocorreu um erro no direcionamento.');
            }
        }

        if (params.slug) {
            processLink();
        }
    }, [params.slug]);

    // UI Limpa e Funcional, focando em performance, sem textos agressivos. 
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
            <Loader2 size={40} className="animate-spin mb-6 text-slate-400" />
            <h2 className="text-sm md:text-base font-medium text-slate-600">
                {message}
            </h2>
        </div>
    );
}
