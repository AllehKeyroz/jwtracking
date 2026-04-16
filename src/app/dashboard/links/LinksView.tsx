'use client';

import { useState } from 'react';
import { createLink, deleteLink, getLinkAudience } from './actions';
import { Link as LinkIcon, Plus, Trash2, ExternalLink, Activity, Hash, ArrowRight, MousePointerClick, CheckCircle2, Copy, Users, Clock, Globe, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import LeadHistoryModal from '@/components/LeadHistoryModal';

export default function LinksView({ initialLinks }: { initialLinks: any[] }) {
    const [links, setLinks] = useState(initialLinks);
    const [loading, setLoading] = useState(false);
    const [loadingAudience, setLoadingAudience] = useState(false);
    const router = useRouter();

    const [modal, setModal] = useState(false);
    const [audienceModal, setAudienceModal] = useState(false);
    const [historyModal, setHistoryModal] = useState<{ open: boolean, leadId: string, leadName: string }>({ open: false, leadId: '', leadName: '' });
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [audience, setAudience] = useState<any[]>([]);
    const [form, setForm] = useState({ slug: '', destinationUrl: '', rotatorUrls: '' });

    const handleCreate = async () => {
        if (!form.slug || !form.destinationUrl) return alert("Preencha o Slug e o Destino");
        setLoading(true);
        try {
            await createLink({
                slug: form.slug,
                destinationUrl: form.destinationUrl,
                rotatorUrls: form.rotatorUrls
            });
            setModal(false);
            setForm({ slug: '', destinationUrl: '', rotatorUrls: '' });
            router.refresh();
        } catch (e: any) {
            alert(e.message || "Erro");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja apagar o Link? Isso quebrará os anúncios rodando.")) return;
        setLoading(true);
        try {
            await deleteLink(id);
            router.refresh();
        } catch (e: any) {
            alert(e.message || "Erro ao remover o link.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (e: React.MouseEvent, slug: string) => {
        e.stopPropagation();
        const url = `${window.location.protocol}//${window.location.host}/kds/${slug}`;
        navigator.clipboard.writeText(url);
        alert("Link Rastreável copiado!");
    };

    const openAudience = async (slug: string) => {
        setSelectedSlug(slug);
        setAudienceModal(true);
        setLoadingAudience(true);
        try {
            const data = await getLinkAudience(slug);
            setAudience(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAudience(false);
        }
    };

    return (
        <div className="w-full relative">

            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 w-full rounded-2xl backdrop-blur-md mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20">
                        <Activity className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Criador Avançado</h2>
                        <p className="text-sm text-slate-400">Ponto de Entrada da Roda de Atribuição Cross-Device.</p>
                    </div>
                </div>

                <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5">
                    <Plus size={20} /> Criar Novo Link
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links.map((link) => (
                    <div key={link.id} onClick={() => openAudience(link.slug)} className="group relative bg-[#090909] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all shadow-xl hover:shadow-[0_0_40px_rgba(6,182,212,0.1)] cursor-pointer">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-2 text-cyan-400 font-mono">
                                    <Hash size={16} /> <span className="text-lg font-bold">{link.slug}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => handleCopy(e, link.slug)} title="Copiar URL" className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors"><Copy size={16} /></button>
                                    <button onClick={(e) => handleDelete(e, link.id)} disabled={loading} className="text-slate-500 hover:text-red-400 bg-white/5 p-2 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="space-y-4 text-sm font-medium">
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">Destino Central:</span>
                                    <div className="flex items-center gap-2 text-white truncate"><ExternalLink size={14} className="flex-shrink-0 text-cyan-500" /><span className="truncate">{link.destinationUrl}</span></div>
                                </div>
                                {link.rotatorUrls && (
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <span className="block text-slate-500 text-[10px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1"><ArrowRight size={10} /> Round Robin Ativo</span>
                                        <p className="text-slate-300 truncate font-mono text-xs">{link.rotatorUrls}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-black/40 border-t border-white/5 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium"><MousePointerClick size={16} /><span>{link.clicksCount} Cliques</span></div>
                            <span className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Ativo</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Audiência */}
            {audienceModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={(e) => e.target === e.currentTarget && setAudienceModal(false)}>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center border border-cyan-500/20"><Users className="text-cyan-400 w-5 h-5" /></div>
                                <div><h3 className="text-xl font-bold text-white">Audiência do Link</h3><p className="text-xs text-slate-500 font-mono">/kds/{selectedSlug}</p></div>
                            </div>
                            <button onClick={() => setAudienceModal(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {loadingAudience ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" /><p className="text-slate-400 text-sm">Cruzando dados...</p></div>
                            ) : audience.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]"><MousePointerClick className="w-12 h-12 text-slate-600 mx-auto mb-4" /><p className="text-slate-400">Nenhum clique registrado.</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {audience.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => item.lead && setHistoryModal({ open: true, leadId: item.lead.id, leadName: item.lead.name || `+${item.lead.id}` })}
                                            className={cn("bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:border-white/10 transition-colors group", item.lead && "cursor-pointer hover:bg-white/[0.05]")}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", item.lead ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "bg-slate-500/10 border-slate-500/20")}>
                                                    {item.lead ? <CheckCircle2 className="text-emerald-400" /> : <Hash className="text-slate-400" size={18} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white font-bold">{item.lead ? (item.lead.name || `+${item.lead.id}`) : "Visitante Anônimo"}</p>
                                                        {item.lead && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">MATCHED</span>}
                                                        {item.distinctLinksCount > 1 && <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-bold">🎯 {item.distinctLinksCount} LINKS</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(item.clickedAt).toLocaleString('pt-BR')}</span>
                                                        <span className="font-mono">FP: {item.fingerprintHash.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5"><Globe size={12} className="text-cyan-400" /><span className="text-[10px] text-slate-300 font-bold uppercase">{item.trafficSource || 'Direct'}</span></div>
                                                <span className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">{item.utmCampaign}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Criação */}
            {modal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-8 max-w-lg w-full">
                        <h3 className="text-2xl font-bold text-white mb-2">Novo Link</h3>
                        <p className="text-slate-400 text-sm mb-6">Ponte inteligente para WhatsApp ou VSL.</p>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-semibold text-slate-300 mb-1">Caminho (Slug)</label><input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="promocao-vip" className="w-full bg-black border border-white/10 text-white rounded-xl py-3 px-4" /></div>
                            <div><label className="block text-sm font-semibold text-slate-300 mb-1">Destino Final</label><input type="text" value={form.destinationUrl} onChange={e => setForm({ ...form, destinationUrl: e.target.value })} placeholder="https://wa.me/5511..." className="w-full bg-black border border-white/10 text-white rounded-xl py-3 px-4" /></div>
                            <div><label className="block text-sm font-semibold text-slate-300 mb-1">Rotator (Opcional)</label><textarea value={form.rotatorUrls} onChange={e => setForm({ ...form, rotatorUrls: e.target.value })} placeholder="várias urls..." className="w-full bg-black border border-white/10 text-white rounded-xl p-3 h-24" /></div>
                            <div className="pt-4 flex justify-end gap-3"><button onClick={() => setModal(false)} className="px-5 py-2.5 text-slate-400 hover:bg-white/5 rounded-xl">Cancelar</button><button onClick={handleCreate} disabled={loading} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all">Criar Link</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Histórico */}
            {historyModal.open && (
                <LeadHistoryModal leadId={historyModal.leadId} leadName={historyModal.leadName} onClose={() => setHistoryModal({ ...historyModal, open: false })} />
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 99px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.3); }
            `}</style>
        </div>
    );
}
