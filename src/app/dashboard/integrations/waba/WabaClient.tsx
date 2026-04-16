'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';
import { saveWabaConnection } from './actions';

interface WabaClientProps {
    workspaceId: string;
    initialData?: any;
}

export default function WabaClient({ workspaceId, initialData }: WabaClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);
    const [origin, setOrigin] = useState('');

    const [form, setForm] = useState({
        accountId: initialData?.instanceId || '',
        token: initialData?.token || '',
        name: initialData?.name || 'WhatsApp Oficial Cloud'
    });

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const webhookUrl = `${origin}/api/webhooks/waba?workspaceKey=${workspaceId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');

        try {
            await saveWabaConnection(form);
            setSuccess('Conexão Oficial com Meta (WABA) salva com sucesso!');
            setTimeout(() => {
                router.push('/dashboard/integrations');
            }, 2000);
        } catch (err: any) {
            alert(err.message || 'Erro ao salvar integração');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 sm:p-12 relative z-10 w-full max-w-4xl mx-auto h-full flex flex-col">
            <Link href="/dashboard/integrations" className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 w-fit transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium tracking-wide">Voltar para Integrações</span>
            </Link>

            <div className="mb-10 flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight font-sans text-emerald-400 flex items-center gap-3">
                    <ShieldCheck className="text-emerald-500" size={28} />
                    Configurar Cloud API (WABA)
                </h1>
                <p className="text-lg text-slate-400 text-balance">
                    Insira as chaves oficiais do Meta Developer Portal para integrar o rastreamento primário diretamente no WhatsApp Oficial Business.
                </p>
            </div>

            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative">

                {/* Dica da URL do Webhook Meta */}
                <div className="mb-8 p-6 bg-emerald-900/10 border border-emerald-500/20 rounded-2xl flex flex-col gap-3">
                    <span className="text-emerald-400 font-semibold text-sm tracking-widest uppercase">Endpoint Global Facebook Developer</span>
                    <p className="text-slate-300 text-sm">Cole esta URL na caixa Callback URL e use <b className="text-white">kds_waba_godmode</b> como Verify Token:</p>
                    <div className="flex items-center gap-4 bg-black/60 p-4 border border-white/10 rounded-xl relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" />
                        <code className="text-emerald-300 text-sm font-mono break-all ml-2 flex-1">
                            {origin ? webhookUrl : 'Carregando URL...'}
                        </code>
                        {origin && (
                            <button
                                onClick={handleCopy}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-emerald-400"
                                title="Copiar Endpoint"
                            >
                                {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm tracking-wide font-medium text-slate-300">WABA Account ID (ID do App Meta / Phone Number ID)</label>
                        <input
                            type="text"
                            required
                            placeholder="1234567890123"
                            value={form.accountId}
                            onChange={e => setForm({ ...form, accountId: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm tracking-wide font-medium text-slate-300">Permanent System User Token (Bearer)</label>
                        <input
                            type="password"
                            required
                            placeholder="EAAJXZA..."
                            value={form.token}
                            onChange={e => setForm({ ...form, token: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm tracking-wide font-medium text-slate-300">Apelido (Ex: Número Oficial Loja)</label>
                        <input
                            type="text"
                            required
                            placeholder="Loja Virtual WABA 1"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

                    {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">{success}</div>}

                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Autenticar com WABA'}
                        </button>
                    </div>
                </form>

                {/* Guia de Documentação Real-time */}
                <IntegrationDocs type="WABA" />
            </div>
        </div>
    );
}

import IntegrationDocs from '@/components/IntegrationDocs';
