'use client';

import { useState } from 'react';
import { Network, Database, MessageCircle, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function IntegrationsPage() {
    return (
        <div className="p-8 sm:p-12 relative z-10 w-full max-w-6xl mx-auto h-full flex flex-col">
            {/* Header Sensorial */}
            <div className="mb-10 flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight font-sans text-white flex items-center gap-3">
                    <Network className="text-cyan-400" size={28} />
                    Integrações & Webhooks
                </h1>
                <p className="text-lg text-slate-400">
                    Conecte o cérebro da KDS ao WhatsApp e às plataformas de anúncios para atribuição militar de cliques e identidades.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Evolution API Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110" />
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-cyan-950/40 rounded-2xl border border-cyan-500/30 text-cyan-400">
                            <MessageCircle size={24} />
                        </div>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-300 tracking-wider">
                            WHATSAPP
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Evolution API</h2>
                    <p className="text-sm text-slate-400 mb-8 min-h-[60px]">
                        Conecte instâncias paralelas de WhatsApp Scanners via Baileys. Ideal para múltiplos números de operação corporativa simultânea.
                    </p>

                    <Link href="/dashboard/integrations/evolution" className="flex items-center justify-between w-full px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all group-hover:bg-cyan-950/30 group-hover:border-cyan-500/30">
                        Configurar Webhook
                        <ArrowRight size={16} className="text-cyan-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Cloud API (WABA) Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110" />
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 text-emerald-400">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-emerald-300 tracking-wider bg-emerald-500/10 border-emerald-500/20">
                            WHATSAPP OFICIAL
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Cloud API (WABA)</h2>
                    <p className="text-sm text-slate-400 mb-8 min-h-[60px]">
                        Integração direta com o Graph do Meta. Para números oficiais vinculados à conta Business do Facebook. Acompanha o Challenge Hub nativo.
                    </p>

                    <Link href="/dashboard/integrations/waba" className="flex items-center justify-between w-full px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-all group-hover:bg-emerald-950/30 group-hover:border-emerald-500/30">
                        Conectar Instância WABA
                        <ArrowRight size={16} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Meta Ads Card - SOON */}
                <div className="bg-white/5 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden opacity-50 grayscale select-none">
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-slate-400">
                            <Database size={24} />
                        </div>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-slate-400 tracking-wider">
                            TRÁFEGO PAGO
                        </span>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Meta Ads Offline Conversions</h2>
                    <p className="text-sm text-slate-400 mb-8 min-h-[60px]">
                        Bypass de Pixel CAPI. Retorne vendas validadas com pontuação perfeita baseada no Machine Learning gerado pelo Tracker (Fase 6).
                    </p>

                    <button disabled className="flex items-center justify-center w-full px-5 py-3 bg-black/40 border border-white/5 text-slate-500 text-sm font-medium rounded-xl cursor-not-allowed">
                        Liberado na Fase 6
                    </button>
                </div>
            </div>
        </div>
    );
}
