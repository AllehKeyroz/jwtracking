'use client';

import { useState } from 'react';
import { deleteLead } from './actions';
import { Search, Trash2, Fingerprint, Phone, CheckCircle2, UserCircle2, Clock, AlertTriangle, Eye, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LeadHistoryModal from '@/components/LeadHistoryModal';

export default function LeadsView({ initialLeads }: { initialLeads: any[] }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [historyModal, setHistoryModal] = useState<{ open: boolean, leadId: string, leadName: string }>({ open: false, leadId: '', leadName: '' });

    const filteredLeads = initialLeads.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.id.includes(search)
    );

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja apagar os registros do Lead ${name || id}? Isso removerá as conversas atreladas a ele!`)) return;
        setLoading(true);
        try {
            await deleteLead(id);
            router.refresh();
        } catch (e: any) {
            alert(e.message || "Erro ao apagar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full relative animate-in fade-in duration-700">

            {/* Header / Search Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 border border-white/10 p-6 w-full rounded-3xl backdrop-blur-md mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                        <Activity className="text-indigo-400 w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Base de Contatos</h2>
                        <p className="text-xs text-slate-400 font-medium">Gestão de Identidades e Atribuição Cruzada.</p>
                    </div>
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou número..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-[#050505] border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 bg-white/[0.02]">
                                <th className="px-6 py-5 font-bold">Contato / Identidade</th>
                                <th className="px-6 py-5 font-bold text-center">Inteligência de Atribuição</th>
                                <th className="px-6 py-5 font-bold text-right pr-8">Ações de Perfil</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm font-medium">
                            {filteredLeads.map((lead) => {
                                const matched = !!lead.matchedHash;
                                return (
                                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 flex items-center justify-center text-cyan-400 border border-white/10 overflow-hidden shadow-lg group-hover:border-cyan-500/30 transition-all">
                                                    {lead.avatarUrl ? (
                                                        <img src={lead.avatarUrl} alt={lead.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserCircle2 size={28} className="opacity-40" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">{lead.name || `+${lead.id}`}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                            <Phone size={10} /> {lead.id}
                                                        </span>
                                                        <span className="text-[10px] text-slate-600 font-medium">
                                                            {new Date(lead.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-2">
                                                {/* Badge de Hardware */}
                                                {matched ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                        <Fingerprint size={12} /> HARDWARE SYNCED
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 border border-white/5 text-slate-500 text-[10px] font-bold">
                                                        <AlertTriangle size={12} /> ANONYMOUS ORIGIN
                                                    </div>
                                                )}

                                                {/* Insights de IA (Fase 5) */}
                                                <div className="flex gap-1.5">
                                                    {lead.aiIntentLevel && (
                                                        <div className={cn(
                                                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border",
                                                            lead.aiIntentLevel === 'Quente' ? "bg-orange-500/10 text-orange-400 border-orange-500/30" :
                                                                lead.aiIntentLevel === 'Morno' ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" :
                                                                    "bg-slate-500/10 text-slate-400 border-white/10"
                                                        )}>
                                                            {lead.aiIntentLevel}
                                                        </div>
                                                    )}
                                                    {lead.aiDealClosed && (
                                                        <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                            <CheckCircle2 size={10} /> Shark Deal
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Clock size={10} />
                                                    {lead.lastMessageAt ? new Date(lead.lastMessageAt).toLocaleString() : 'No History'}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-5 text-right pr-8">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => setHistoryModal({ open: true, leadId: lead.id, leadName: lead.name || `+${lead.id}` })}
                                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl transition-all text-xs font-bold shadow-lg"
                                                >
                                                    <Eye size={16} /> Jornada Completa
                                                </button>
                                                <Link href={`/dashboard/conversations`} className="p-2.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all shadow-lg" title="Abrir Chat">
                                                    <Activity size={18} />
                                                </Link>
                                                <button onClick={() => handleDelete(lead.id, lead.name)} disabled={loading} className="p-2.5 text-slate-600 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all border border-transparent hover:border-red-400/20">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredLeads.length === 0 && (
                    <div className="p-24 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Search size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Lead Não Localizado</h3>
                        <p className="max-w-xs mx-auto text-slate-500 text-sm">Ajuste os filtros ou verifique se o hardware já foi mapeado no Monitor.</p>
                    </div>
                )}
            </div>

            {/* Modal de Histórico */}
            {historyModal.open && (
                <LeadHistoryModal
                    leadId={historyModal.leadId}
                    leadName={historyModal.leadName}
                    onClose={() => setHistoryModal({ ...historyModal, open: false })}
                />
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 99px; }
            `}</style>
        </div>
    );
}
