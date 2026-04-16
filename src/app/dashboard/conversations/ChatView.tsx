'use client';

import { useState, useEffect } from 'react';
import { Bot, MessageSquare, Search, Phone, RefreshCcw, Send, CheckCheck, Loader2, Brain, Sparkles, Globe, Info, X, Copy } from 'lucide-react';
import { getLeadMessages, getConversationLeads, sendMessageToLead, updateLeadName, analyzeConversationAction, refreshLeadProfile } from './actions';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

export default function ChatView({ initialLeads }: { initialLeads: any[] }) {
    const [leads, setLeads] = useState(initialLeads);
    const [selectedLead, setSelectedLead] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMsg, setLoadingMsg] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

    // Auto-Refresh silencioso a cada 4 segundos
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const latestLeads = await getConversationLeads();
                setLeads(latestLeads);
                if (selectedLead) {
                    const msgs = await getLeadMessages(selectedLead);
                    setMessages(msgs);
                }
            } catch (e) { }
        }, 4000);
        return () => clearInterval(interval);
    }, [selectedLead]);

    // Renomear Contato (Salvar Contato)
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [syncingProfile, setSyncingProfile] = useState(false);

    const handleRefreshProfile = async () => {
        if (!selectedLead) return;
        setSyncingProfile(true);
        try {
            await refreshLeadProfile(selectedLead);
            const latestLeads = await getConversationLeads();
            setLeads(latestLeads);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSyncingProfile(false);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedLead) return;
        setAnalyzing(true);
        try {
            await analyzeConversationAction(selectedLead);
            const latestLeads = await getConversationLeads();
            setLeads(latestLeads);
        } catch (e: any) {
            alert(e.message || "Erro na análise");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSaveName = async () => {
        if (!selectedLead || !tempName.trim()) return;
        try {
            await updateLeadName(selectedLead, tempName);
            setLeads(leads.map(l => l.id === selectedLead ? { ...l, name: tempName } : l));
        } catch (e) { } finally {
            setEditingName(false);
        }
    };

    // Send Message
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Filter
    const [search, setSearch] = useState('');
    const filteredLeads = leads.filter(l => l.id.includes(search) || l.name?.toLowerCase().includes(search.toLowerCase()));

    const loadMessages = async (leadId: string) => {
        if (selectedLead === leadId) return; // Prevent reload flash
        setSelectedLead(leadId);
        setLoadingMsg(true);
        setEditingName(false);
        try {
            const msgs = await getLeadMessages(leadId);
            setMessages(msgs);
        } catch (e) { } finally {
            setLoadingMsg(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const latestLeads = await getConversationLeads();
            setLeads(latestLeads);
            if (selectedLead) {
                // background refresh das msgs do msm lead
                getLeadMessages(selectedLead).then(m => setMessages(m));
            }
        } catch (e) { } finally { setRefreshing(false); }
    };

    const handleSend = async () => {
        if (!replyText.trim() || !selectedLead || sending) return;
        setSending(true);
        const txt = replyText;
        setReplyText('');

        // Optimistic UI update
        const fakeMsg = {
            id: 'temp_' + Date.now(),
            direction: 'OUTBOUND',
            type: 'TEXT',
            content: txt,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, fakeMsg]);

        try {
            await sendMessageToLead(selectedLead, txt);
        } catch (e: any) {
            alert(e.message || "Falha ao enviar mensagem");
            // Reload pra reverter se falhou
            const msgs = await getLeadMessages(selectedLead);
            setMessages(msgs);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="w-full flex h-[calc(100vh-64px)] flex-row">

            {/* Esquerda: Lista de Leads (O WhatsApp Web clone) */}
            <div className="w-96 flex flex-col bg-white/5 border-r border-white/5">
                <div className="p-4 border-b border-white/5 bg-black/40">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                            <MessageSquare className="text-cyan-400" /> Conversas
                        </h2>
                        <button onClick={handleRefresh} disabled={refreshing} className="p-2 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-lg transition-all disabled:opacity-50">
                            <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar numero ou nome..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {filteredLeads.map(lead => (
                        <div
                            key={lead.id}
                            onClick={() => loadMessages(lead.id)}
                            className={cn(
                                "flex flex-col p-4 border-b border-white/5 cursor-pointer transition-all w-full",
                                selectedLead === lead.id ? "bg-cyan-500/10 border-l-4 border-l-cyan-500" : "hover:bg-white/5 border-l-4 border-l-transparent"
                            )}
                        >
                            <div className="flex gap-3 items-center w-full">
                                <div className="w-10 h-10 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-800/50 flex-shrink-0 overflow-hidden text-[10px]">
                                    {lead.avatarUrl ? (
                                        <img src={lead.avatarUrl} alt={lead.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Bot size={20} />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start mb-0.5 w-full">
                                        <span className="font-bold text-white text-sm truncate">{lead.name}</span>
                                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                                            {new Date(lead.lastUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 overflow-hidden">
                                            <Phone size={8} className="text-emerald-400 flex-shrink-0" />
                                            <span className="font-mono">{lead.id}</span>
                                        </div>
                                        {lead.trafficSource && (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20 font-bold uppercase tracking-tighter shadow-sm">
                                                {lead.trafficSource}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1 truncate w-full">
                                        {lead.lastMessage || 'Envio de Midia...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredLeads.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">Nenhum chat capturado.</div>
                    )}
                </div>
            </div>

            {/* Direita: The Chat Box */}
            <div className="flex-1 flex flex-col bg-[#050505] relative">
                {!selectedLead ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Bot size={64} className="opacity-20 mb-4" />
                        <h3 className="text-xl font-medium text-white/50 mb-2">Monitoramento Silencioso</h3>
                        <p className="text-sm max-w-sm text-center">Toda conversa dos seus atendentes nas instancias ou links será mapeada aqui para que a Fase 5 (IA) consiga analisar de noite.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-16 border-b border-white/5 bg-white/5 flex items-center px-6 justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="relative group/avatar">
                                    <div className="w-10 h-10 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 border border-cyan-800/50 overflow-hidden">
                                        {leads.find(l => l.id === selectedLead)?.avatarUrl ? (
                                            <img src={leads.find(l => l.id === selectedLead).avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <MessageSquare size={20} />
                                        )}
                                    </div>
                                    <button
                                        onClick={handleRefreshProfile}
                                        disabled={syncingProfile}
                                        title="Atualizar Foto/Perfil da Evo"
                                        className="absolute -bottom-1 -right-1 p-1 bg-cyan-600 text-white rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all hover:bg-cyan-500 disabled:opacity-50"
                                    >
                                        <RefreshCcw size={10} className={syncingProfile ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                                <div className="flex flex-col">
                                    {!editingName ? (
                                        <h3
                                            className="text-white font-bold cursor-pointer hover:underline underline-offset-4 decoration-white/20"
                                            onClick={() => {
                                                setTempName(leads.find(l => l.id === selectedLead)?.name || '');
                                                setEditingName(true);
                                            }}
                                            title="Clique para Salvar/Renomear Contato"
                                        >
                                            {leads.find(l => l.id === selectedLead)?.name}
                                        </h3>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={tempName}
                                                onChange={e => setTempName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                                                className="bg-black/50 border border-cyan-500/50 rounded px-2 py-0.5 text-sm text-white outline-none w-48"
                                            />
                                            <button onClick={handleSaveName} className="text-xs bg-cyan-600 text-white px-2 py-0.5 rounded hover:bg-cyan-500">Salvar</button>
                                            <button onClick={() => setEditingName(false)} className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded hover:bg-white/20">Cancelar</button>
                                        </div>
                                    )}
                                    <p className="text-xs font-mono text-cyan-400 mt-0.5">+{selectedLead}</p>
                                </div>
                                {leads.find(l => l.id === selectedLead)?.trafficSource && (
                                    <div className="ml-4 px-2 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 text-[10px] text-slate-400">
                                        <Globe size={12} className="text-cyan-500" />
                                        <span>Origem: <b className="text-white uppercase">{leads.find(l => l.id === selectedLead)?.trafficSource}</b></span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {leads.find(l => l.id === selectedLead)?.aiIntentLevel && (
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border",
                                        leads.find(l => l.id === selectedLead)?.aiIntentLevel === 'Quente' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            leads.find(l => l.id === selectedLead)?.aiIntentLevel === 'Morno' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                    )}>
                                        <Sparkles size={10} />
                                        {leads.find(l => l.id === selectedLead)?.aiIntentLevel}
                                    </div>
                                )}

                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                >
                                    <Brain size={14} className={cn(analyzing && "animate-pulse")} />
                                    {analyzing ? "Analisando..." : "Analisar com IA"}
                                </button>
                            </div>
                        </div>

                        {loadingMsg ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="animate-spin text-cyan-500" size={32} />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10">
                                {messages.map((msg, i) => {
                                    const isCompany = msg.direction === 'OUTBOUND';
                                    return (
                                        <div key={msg.id || i} className={cn(
                                            "max-w-[80%] flex flex-col gap-1 w-fit transition-all animate-in fade-in slide-in-from-bottom-2 duration-300",
                                            isCompany ? "self-end items-end" : "self-start items-start"
                                        )}>
                                            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold px-1">{isCompany ? 'Sua Empresa' : 'Lead'}</span>
                                            <div className={cn(
                                                "px-4 py-2.5 rounded-2xl text-sm relative shadow-sm",
                                                isCompany
                                                    ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-none border border-white/10"
                                                    : "bg-gradient-to-br from-cyan-900/60 to-cyan-950/60 text-cyan-50 border border-cyan-800/30 rounded-tl-none"
                                            )}>
                                                {msg.type !== 'TEXT' && (
                                                    <div className="flex items-center gap-1.5 mb-2 text-[10px] font-black uppercase opacity-60 bg-black/20 w-fit px-2 py-0.5 rounded">
                                                        <span>[{msg.type}]</span>
                                                    </div>
                                                )}
                                                <div className="whitespace-pre-wrap break-words leading-relaxed">
                                                    {msg.content || <span className="italic opacity-40">-- mídia sem legenda --</span>}
                                                </div>

                                                <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-1">
                                                    <span className="text-[9px] text-slate-600 font-mono">
                                                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {msg.rawPayload && (
                                                            <button
                                                                onClick={() => setSelectedPayload(msg.rawPayload)}
                                                                className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                                                                title="Ver Payload de Debug"
                                                            >
                                                                <Info size={12} />
                                                            </button>
                                                        )}
                                                        {isCompany && (
                                                            <CheckCheck size={12} className="text-cyan-400 opacity-70" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-4" />
                            </div>
                        )}

                        <div className="h-20 border-t border-white/5 bg-black/50 flex items-center px-6 gap-4">
                            <input
                                type="text"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                                placeholder="Digite sua mensagem para o Lead..."
                                className="flex-1 bg-white/5 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500/50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !replyText.trim()}
                                className="p-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white transition-all disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Payload para Debug */}
            {selectedPayload && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Auditoria de Webhook</h3>
                                    <p className="text-xs text-slate-500">Payload bruto recebido da Evolution API</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedPayload);
                                        alert("Payload copiado!");
                                    }}
                                    className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
                                    title="Copiar JSON"
                                >
                                    <Copy size={20} />
                                </button>
                                <button
                                    onClick={() => setSelectedPayload(null)}
                                    className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6 bg-black/40">
                            <pre className="text-xs font-mono text-cyan-50/70 whitespace-pre-wrap leading-relaxed px-4 py-2">
                                {JSON.stringify(JSON.parse(selectedPayload), null, 4)}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-white/5 text-center bg-white/5 text-[10px] text-slate-600 uppercase font-black tracking-tighter">
                            KDS Debug Engine v1.0
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
