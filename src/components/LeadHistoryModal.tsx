'use client';

import { useState, useEffect } from 'react';
import { getLeadHistory } from '@/app/dashboard/leads/actions';
import { X, Clock, MousePointerClick, Globe, Calendar, User, Hash, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadHistoryModalProps {
    leadId: string;
    leadName: string;
    onClose: () => void;
}

export default function LeadHistoryModal({ leadId, leadName, onClose }: LeadHistoryModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getLeadHistory(leadId);
                setHistory(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [leadId]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-cyan-500/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                            <User className="text-cyan-400 w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-tight">{leadName || leadId}</h3>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                                <Hash size={12} /> ID: {leadId}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 p-2.5 rounded-full transition-all hover:rotate-90">
                        <X size={20} />
                    </button>
                </div>

                {/* Timeline content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={14} className="text-yellow-500" /> Jornada de Atribuição
                        </h4>
                        <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-1 rounded-md border border-white/5 font-mono">
                            {history.length} EVENTOS
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                            <p className="text-slate-400 text-sm animate-pulse font-medium">Cruzando dados de hardware...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                            <MousePointerClick className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                            <p className="text-slate-400">Nenhum histórico de clique encontrado.</p>
                        </div>
                    ) : (
                        <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                            {history.map((item, idx) => (
                                <div key={item.id} className="relative pl-12 group">
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                        "absolute left-0 w-10 h-10 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center shadow-lg transition-all group-hover:scale-110",
                                        idx === 0 ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-white/5 text-slate-500 border-white/10"
                                    )}>
                                        <Clock size={16} />
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all hover:bg-white/[0.04]">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1 block">Clique em Link de Atribuição</span>
                                                <h5 className="text-lg font-bold text-white flex items-center gap-2">
                                                    /kds/{item.linkSlug}
                                                </h5>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5 mb-2">
                                                    <Globe size={12} className="text-cyan-400" />
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase">{item.trafficSource || 'Direct'}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 font-mono">
                                                    {new Date(item.clickedAt).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            {item.utmCampaign && (
                                                <div className="bg-black/40 p-2 rounded-xl border border-white/5 overflow-hidden">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter block mb-0.5">Campanha:</span>
                                                    <p className="text-[11px] text-white truncate font-mono">{item.utmCampaign}</p>
                                                </div>
                                            )}
                                            {item.utmMedium && (
                                                <div className="bg-black/40 p-2 rounded-xl border border-white/5 overflow-hidden">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter block mb-0.5">Médio:</span>
                                                    <p className="text-[11px] text-white truncate font-mono">{item.utmMedium}</p>
                                                </div>
                                            )}
                                            {item.utmContent && (
                                                <div className="bg-black/40 p-2 rounded-xl border border-white/5 overflow-hidden col-span-2">
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter block mb-0.5">Criativo / Conteúdo:</span>
                                                    <p className="text-[11px] text-white truncate font-mono">{item.utmContent}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/[0.01] overflow-hidden">
                    <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em] font-bold text-center">
                        Relatório de Jornada Multi-Toque Real-Time KDS Tracker
                    </p>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 99px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.3);
                }
            `}</style>
        </div>
    );
}
