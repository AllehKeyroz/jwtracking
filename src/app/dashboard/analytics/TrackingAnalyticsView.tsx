'use client';

import { useState, useEffect } from 'react';
import { getRecentTrackingData, deleteClickSession, deleteFingerprint } from './actions';
import { Fingerprint, MousePointer2, Clock, Globe, Cpu, Monitor, RefreshCcw, Trash2, Smartphone, Monitor as DesktopIcon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TrackingAnalyticsView({ initialData }: { initialData: any }) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        setLoading(true);
        try {
            const newData = await getRecentTrackingData();
            setData(newData);
        } catch (e) { } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = async (id: string) => {
        if (!confirm("Deseja excluir este registro de atribuição?")) return;
        try {
            await deleteClickSession(id);
            refresh();
        } catch (e) { alert("Erro ao excluir."); }
    };

    const handleDeleteFP = async (id: string) => {
        if (!confirm("Excluir este Hardware ID? Isso afetará o histórico de mapeamento.")) return;
        try {
            await deleteFingerprint(id);
            refresh();
        } catch (e) { alert("Erro ao excluir hardware."); }
    };

    useEffect(() => {
        const interval = setInterval(refresh, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Fingerprint className="text-cyan-400" /> Monitor de Atribuição
                </h2>
                <button onClick={refresh} className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl text-cyan-400 border border-cyan-500/20 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <RefreshCcw size={20} className={cn(loading && "animate-spin")} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Cliques Recentes */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <MousePointer2 size={16} className="text-cyan-500" /> Atividade Recente
                    </h3>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white/[0.03] text-slate-400 text-[10px] uppercase font-bold border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Canal</th>
                                    <th className="px-6 py-4">Dispositivo Mapeado</th>
                                    <th className="px-6 py-4 text-right pr-10">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {data.clicks.map((click: any) => (
                                    <tr key={click.id} className="hover:bg-cyan-500/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-slate-300 font-medium">
                                            {new Date(click.clickedAt).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20 text-[10px] font-bold">
                                                {click.trafficSource || 'DIRETO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-xs">{click.fingerprint?.deviceModel || 'Aparelho Desconhecido'}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">ID: {click.fingerprintHash.substring(0, 8)}...</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <button onClick={() => handleDeleteClick(click.id)} className="text-slate-600 hover:text-red-400 transition-all p-2 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Hardware Registry - Agora focando no MODELO */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Smartphone size={16} className="text-indigo-400" /> Registro de Aparelhos
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {data.fingerprints.map((fp: any) => (
                            <div key={fp.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-4 right-4 z-20">
                                    <button onClick={() => handleDeleteFP(fp.id)} className="text-slate-600 hover:text-red-400 p-1.5 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                            {fp.deviceType === 'Mobile' ? <Smartphone className="text-indigo-400" size={20} /> : <DesktopIcon className="text-indigo-400" size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white leading-tight">{fp.deviceModel || 'Aparelho Genérico'}</h4>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{fp.os || 'OS Unknown'}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <Zap size={10} className="text-cyan-500" />
                                            <span className="font-mono">{fp.id.substring(0, 8)}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium">
                                            {fp.screenResolution}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
