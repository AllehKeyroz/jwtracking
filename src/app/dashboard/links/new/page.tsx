'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Target, AlertCircle, Save, Link as LinkIcon } from 'lucide-react';
import { createTrackLink } from './actions';

export default function NewTrackLinkPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        try {
            const res = await createTrackLink(formData);
            if (res?.error) {
                setError(res.error);
                setLoading(false);
            } else {
                router.push('/dashboard/links');
                router.refresh();
            }
        } catch (err) {
            setError('A Conexão com a Matriz falhou.');
            setLoading(false);
        }
    };

    return (
        <div className="p-8 sm:p-12 relative z-10 w-full max-w-4xl mx-auto h-full flex flex-col">
            {/* Botão Retornar Comando */}
            <Link href="/dashboard/links" className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 w-fit transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium tracking-wide">Voltar para Links</span>
            </Link>

            {/* Header Sensorial */}
            <div className="mb-10 flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight font-sans text-white flex items-center gap-3">
                    <Target className="text-cyan-400" size={28} />
                    Novo Link de Rastreio
                </h1>
                <p className="text-lg text-slate-400">
                    Configure a URL encurtada que irá redirecionar o usuário após a coleta de dados de dispositivo.
                </p>
            </div>

            {/* Box de Formulário Premium Glassmorphism */}
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative">
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/10 rounded-tr-3xl m-4 pointer-events-none" />

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Slug Input */}
                    <div className="space-y-2">
                        <label className="text-sm tracking-wide font-medium text-slate-300">URL Curta (Slug Único)</label>
                        <div className="relative flex items-stretch">
                            <span className="flex items-center justify-center px-4 bg-black/40 border border-r-0 border-white/10 rounded-l-xl text-slate-500 font-mono text-sm">
                                loj.in/
                            </span>
                            <input
                                type="text"
                                name="slug"
                                required
                                placeholder="blackfriday-26"
                                className="flex-1 bg-black/40 border border-white/10 rounded-r-xl px-4 py-3.5 text-cyan-400 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Este é o final do link que você fornecerá aos seus clientes.</p>
                    </div>

                    {/* Destino Input */}
                    <div className="space-y-2">
                        <label className="text-sm tracking-wide font-medium text-slate-300">URL Destino Principal</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LinkIcon className="h-4 w-4 text-slate-500" />
                            </div>
                            <input
                                type="url"
                                name="destinationUrl"
                                required
                                placeholder="https://wa.me/5511... ou https://loja.com"
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Para onde o usuário será finalmente redirecionado após o registro.</p>
                    </div>

                    {/* Round Robin Input */}
                    <div className="space-y-2">
                        <label className="text-sm tracking-wide font-medium text-slate-300">
                            Rotatividade (Round Robin) <span className="text-cyan-400 text-xs ml-2">Opcional</span>
                        </label>
                        <textarea
                            name="rotatorUrls"
                            rows={3}
                            placeholder="Insira URLs secundárias aqui, uma por linha..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-700 resize-none font-mono text-sm"
                        ></textarea>
                        <p className="text-xs text-slate-500 mt-1">
                            Para alternar o tráfego entre múltiplos WhatsApps, cole uma URL por linha. Deixe em branco se for usar apenas o Destino Principal.
                        </p>
                    </div>

                    {/* Spacer Line */}
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

                    {/* Actions */}
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
                            className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Criar Link Ativo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
