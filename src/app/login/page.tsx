'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            if (res?.error) {
                setError(res.error);
                setLoading(false);
            } else {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Erro crítico de comunicação.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070708] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Glow Effects (Estética Jarvis) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl relative z-10 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                        <Activity className="text-cyan-400" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Central de Comando</h1>
                    <p className="text-sm text-slate-400 mt-1">Autenticação necessária para prosseguir.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">E-mail Corporativo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                            placeholder="seu@dominio.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Chave de Acesso</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-slate-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] flex justify-center items-center"
                    >
                        {loading ? <Activity className="animate-spin" size={20} /> : 'Iniciar Sessão Secreta'}
                    </button>
                </form>

                {/* Adorno Interface Lateral */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/20 rounded-tr-3xl m-4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/20 rounded-bl-3xl m-4 pointer-events-none" />
            </div>
        </div>
    );
}
