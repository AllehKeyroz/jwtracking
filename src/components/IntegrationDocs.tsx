'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, ShieldCheck, Zap, Server, Globe, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function IntegrationDocs({ type }: { type: 'WABA' | 'EVOLUTION' }) {
    const [isOpen, setIsOpen] = useState(false);

    const wabaSteps = [
        {
            title: "Meta for Developers",
            icon: <Globe className="text-cyan-400" size={18} />,
            content: "Acesse developers.facebook.com e crie um App do tipo 'Business'. Adicione o produto 'WhatsApp' ao seu aplicativo."
        },
        {
            title: "Capturar IDs",
            icon: <Key className="text-amber-400" size={18} />,
            content: "No menu lateral, vá em WhatsApp > Configurações da API. Copie o 'Phone Number ID' (AccountId) e gere um Token de Acesso Permanente."
        },
        {
            title: "Configurar Webhook",
            icon: <Zap className="text-emerald-400" size={18} />,
            content: "Copie a URL dinâmica acima e cole-a no campo 'Callback URL' da Meta. Use 'kds_waba_godmode' como Verify Token."
        },
        {
            title: "Assinar Mensagens",
            icon: <ShieldCheck className="text-indigo-400" size={18} />,
            content: "No portal da Meta, em Webhooks, clique em 'Manage' e assine o campo 'messages' para que o Tracker receba os eventos."
        }
    ];

    const evolutionSteps = [
        {
            title: "Gateway Central",
            icon: <Server className="text-cyan-400" size={18} />,
            content: "Informe a URL da sua API Evolution e a Global API Key no painel de Configuração Master acima."
        },
        {
            title: "Criar Instância",
            icon: <PlusCircle className="text-amber-400" size={18} />,
            content: "Dê um nome para sua nova instância (ex: Suporte 01) e clique em 'Criar'. O Tracker configurará o Webhook sozinho."
        },
        {
            title: "Escaneamento",
            icon: <QrCode className="text-emerald-400" size={18} />,
            content: "Clique em 'Forçar QR' e escaneie o código com seu WhatsApp. A instância passará para o status ONLINE."
        }
    ];

    const steps = type === 'WABA' ? wabaSteps : evolutionSteps;

    return (
        <div className="w-full mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 group-hover:scale-110 transition-transform">
                        <BookOpen className="text-indigo-400" size={20} />
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-white text-sm">Guia Rápido de Implementação</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">Clique para ver o passo a passo de iniciante</p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
            </button>

            {isOpen && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in zoom-in-95 duration-300">
                    {steps.map((step, idx) => (
                        <div key={idx} className="bg-black/40 border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
                            <div className="absolute -right-2 -top-2 text-white/5 font-black text-4xl group-hover:text-white/10 transition-colors">{idx + 1}</div>
                            <div className="flex items-center gap-2 mb-3">
                                {step.icon}
                                <h5 className="font-bold text-white text-xs uppercase tracking-tight">{step.title}</h5>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">{step.content}</p>
                        </div>
                    ))}

                    {type === 'WABA' && (
                        <div className="md:col-span-2 lg:col-span-4 mt-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                            <ShieldCheck className="text-emerald-500 flex-shrink-0" size={20} />
                            <div className="text-[11px] text-emerald-200/80 leading-relaxed">
                                <p className="font-bold mb-1">WhatsApp Coexistente Ativo:</p>
                                Esta integração permite que você use o mesmo número no celular (App Business) e aqui. Basta garantir que o App no seu celular esteja na versão 2.24.17 ou superior.
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PlusCircle(props: any) { return <Zap {...props} /> }
function QrCode(props: any) { return <Zap {...props} /> }
