'use client';

import { useEffect, useState, useRef } from 'react';
import { registerClick } from './actions';
import { getFingerprint } from '@/lib/tracking-client';
import { Loader2, ShieldCheck, Zap } from 'lucide-react';

export default function TrackingPortal({ slug, workspaceId, destination }: { slug: string, workspaceId: string, destination: string }) {
    const [status, setStatus] = useState('Analisando conexão segura...');
    const [redirecting, setRedirecting] = useState(false);
    const hasTracked = useRef(false);

    useEffect(() => {
        if (hasTracked.current) return;
        hasTracked.current = true;

        const performTracking = async () => {
            try {
                const fingerprint = getFingerprint();
                const urlParams = new URLSearchParams(window.location.search);
                const trackedPhone = urlParams.get('kdstracker');

                // AGUARDAR o registro para garantir que o clique foi salvo
                await registerClick({
                    slug: String(slug || 'unknown'),
                    workspaceId: String(workspaceId || ''),
                    fingerprintHash: String(fingerprint.hash),
                    gpuVendor: String(fingerprint.gpuVendor),
                    screenResolution: String(fingerprint.screenResolution),
                    userAgent: fingerprint.userAgent,
                    os: fingerprint.os,
                    deviceType: fingerprint.deviceType,
                    deviceModel: fingerprint.deviceModel,
                    clickId: urlParams.get('fbclid') || urlParams.get('gclid') || urlParams.get('ttclid'),
                    trafficSource: urlParams.get('utm_source') || 'Organic',
                    utmMedium: urlParams.get('utm_medium'),
                    utmCampaign: urlParams.get('utm_campaign') || 'Direct',
                    utmTerm: urlParams.get('utm_term'),
                    utmContent: urlParams.get('utm_content'),
                    phone: trackedPhone
                });

                let finalUrl = destination;
                if (!finalUrl.startsWith('http')) {
                    finalUrl = `https://${finalUrl}`;
                }

                setStatus('Identidade verificada. Redirecionando...');
                setRedirecting(true);

                // Redirecionamento instantâneo após o await
                window.location.replace(finalUrl);

            } catch (err) {
                console.error("Tracking Error:", err);
                window.location.replace(destination);
            }
        };

        performTracking();
    }, [slug, workspaceId, destination]);

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-sm w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse" />
                        <div className="w-20 h-20 bg-black border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                            <Zap className="text-cyan-400 w-10 h-10 animate-pulse" />
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">KDS <span className="text-cyan-400">Tracker</span></h1>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4">
                        {!redirecting ? (
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        ) : (
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                                <ShieldCheck className="text-emerald-500 w-6 h-6" />
                            </div>
                        )}
                        <p className="text-slate-300 font-medium text-sm tracking-wide">{status}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
