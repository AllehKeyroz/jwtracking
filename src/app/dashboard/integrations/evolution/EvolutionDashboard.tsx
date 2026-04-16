'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, QrCode, RefreshCw, Trash2, CheckCircle2, AlertTriangle, MonitorSmartphone } from 'lucide-react';
import { saveEvolutionGateway, createEvolutionInstance, getEvolutionInstanceStatus, getEvolutionQrCode, deleteEvolutionInstance, syncEvolutionInstances } from './actions';

export default function EvolutionClientManager({ initialConnections, workspaceId, originUrl }: any) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Gateway Settings State
    const masterConfig = initialConnections.find((c: any) => c.instanceId === 'master_setup' || c.name === 'Gateway Principal Evolution');
    const hasConfig = !!masterConfig;
    const [url, setUrl] = useState(masterConfig ? masterConfig.token.split('|')[0] : '');
    const [apiKey, setApiKey] = useState(masterConfig ? masterConfig.token.split('|')[1] : '');
    const [showConfig, setShowConfig] = useState(!hasConfig);

    // Instances State
    const operativeInstances = initialConnections.filter((c: any) => c.instanceId !== 'master_setup' && c.name !== 'Gateway Principal Evolution');
    const [newInstanceName, setNewInstanceName] = useState('');
    const [qrCode, setQrCode] = useState<{ apiInstanceId: string, base64: string } | null>(null);
    const [statuses, setStatuses] = useState<Record<string, string>>({});

    // Fetch instace status mapping when they load
    useEffect(() => {
        const fetchStatuses = async () => {
            for (const inst of operativeInstances) {
                try {
                    const state = await getEvolutionInstanceStatus(inst.instanceId);
                    setStatuses(prev => ({ ...prev, [inst.instanceId]: state || 'unknown' }));
                } catch {
                    // ignore
                }
            }
        };
        if (operativeInstances.length > 0) {
            fetchStatuses();
        }
    }, [operativeInstances.length]);

    const handleSaveGateway = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveEvolutionGateway(url, apiKey);
            setShowConfig(false);
            router.refresh();
        } catch (e) {
            alert('Erro ao salvar no banco.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInstance = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createEvolutionInstance(newInstanceName);
            setNewInstanceName('');
            router.refresh(); // Refresh props
        } catch (e) {
            alert('Falha ao comunicar com Evolution API. Verifique a URL e a Global Key.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadQr = async (apiInstanceId: string) => {
        try {
            const status = await getEvolutionInstanceStatus(apiInstanceId);
            if (status === 'open') {
                alert('Esta instância já está conectada no WhatsApp!');
                return;
            }

            const base64Data = await getEvolutionQrCode(apiInstanceId);
            if (base64Data) {
                setQrCode({ apiInstanceId, base64: base64Data });
            } else {
                alert('QR Code indisponível. A Evolution pode estar processando ou a instância travou.');
            }
        } catch (e) {
            alert('Erro ao buscar QR Code na Evolution API.');
        }
    };

    const handleDelete = async (id: string, apiInstanceId: string) => {
        if (!confirm('Excluir esta instância do Tracker e da placa do Evolution V2?')) return;
        setLoading(true);
        try {
            await deleteEvolutionInstance(id, apiInstanceId);
            router.refresh();
        } catch (e) { } finally { setLoading(false); }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            await syncEvolutionInstances();
            router.refresh();
        } catch (e: any) {
            alert(e.message || 'Erro ao sincronizar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 sm:p-12 relative z-10 w-full max-w-5xl mx-auto h-full flex flex-col">
            <Link href="/dashboard/integrations" className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 w-fit transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium tracking-wide">Voltar para Integrações</span>
            </Link>

            {/* QR Code Modal Simplificado */}
            {qrCode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#030303] border border-cyan-500/30 p-8 rounded-3xl max-w-sm w-full flex flex-col items-center text-center relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                        <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-emerald-400" />
                        <h3 className="text-xl font-bold text-white mb-2">Conecte o WhatsApp</h3>
                        <p className="text-sm text-slate-400 mb-6">Abra seu WhatsApp {'>'} Dispositivos Conectados {'>'} Múltiplos Aparelhos. Escaneie para ligar o Motor do Tracker.</p>
                        <div className="bg-white p-3 rounded-2xl mb-6">
                            <img src={qrCode.base64} alt="QR Code Evolution" className="w-56 h-56 object-contain" />
                        </div>
                        <button onClick={() => setQrCode(null)} className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all">
                            Fechar e Atualizar Status
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-10 flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight font-sans text-white flex items-center gap-3">
                    Evolution API <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-sm font-bold uppercase rounded-full border border-cyan-500/20">Manager V2</span>
                </h1>
                <p className="text-lg text-slate-400">
                    Crie instâncias injetáveis em milissegundos. Nosso backend conectará automaticamente os gatilhos dos Webhooks pra você.
                </p>
            </div>

            {/* 1. CONFIGURAÇÃO MASTER */}
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl mb-8">
                <div className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex justify-between items-center" onClick={() => setShowConfig(!showConfig)}>
                    <div className="flex items-center gap-3">
                        <MonitorSmartphone className={hasConfig ? "text-emerald-400" : "text-amber-400"} />
                        <div>
                            <h2 className="text-lg font-bold text-white">Servidor Bridge (Gateway Central)</h2>
                            <p className="text-sm text-slate-400">{hasConfig ? 'Servidor configurado. Clique para alterar permissões.' : 'Pendência: Informe as chaves globais da Evolution'}</p>
                        </div>
                    </div>
                </div>

                {showConfig && (
                    <div className="p-6 border-t border-white/10 bg-black/40">
                        <div className="mb-6 px-4 py-3 border-l-2 border-cyan-500 bg-cyan-900/10 text-cyan-300 text-sm">
                            O Tracker precisa ser o cérebro maestro. Informe seu Servidor IP ou Domínio Evolution v2.
                            <br /><span className="text-xs opacity-70">Aviso para nerds: Não precismos criar webhook manual. O Tracker assinará seu ID (`{workspaceId}`) sozinho na criação.</span>
                        </div>
                        <form onSubmit={handleSaveGateway} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">URL Evolution Base</label>
                                <input type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.meusite.com" className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Global API Key</label>
                                <input type="password" required value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="B629X1..." className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors" />
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-2">
                                <button type="submit" disabled={loading} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                                    <Save size={18} /> {loading ? 'Fixando Servidor...' : 'Salvar Gateway Master'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* 2. INSTANCES DASHBOARD */}
            {hasConfig && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Instâncias do Projeto</h2>
                        <div className="flex gap-4 items-center">
                            <button onClick={handleSync} disabled={loading} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors cursor-pointer group disabled:opacity-50">
                                <RefreshCw size={16} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                                Sincronizar Existentes
                            </button>
                            {/* Inline Create Form */}
                            <form onSubmit={handleCreateInstance} className="flex gap-2">
                                <input
                                    type="text" value={newInstanceName} required onChange={e => setNewInstanceName(e.target.value)}
                                    placeholder="Nome. Ex: Suporte KDS"
                                    className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50"
                                />
                                <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors">
                                    <Plus size={16} /> Criar Instância
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {operativeInstances.length === 0 && (
                            <div className="col-span-2 p-12 bg-white/5 border border-white/10 border-dashed rounded-3xl text-center flex flex-col items-center justify-center">
                                <QrCode className="text-slate-500 mb-4" size={40} />
                                <h3 className="text-white font-bold mb-1">Nenhum Aparelho Conectado</h3>
                                <p className="text-slate-400 text-sm">Alerte a Evolution API criando uma instância no topo e escaneando o código de segurança do Zap.</p>
                            </div>
                        )}

                        {operativeInstances.map((inst: any) => (
                            <div key={inst.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col relative group overflow-hidden">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-white leading-tight">{inst.name}</h3>
                                            {statuses[inst.instanceId] === 'open' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ONLINE</span>}
                                            {statuses[inst.instanceId] === 'connecting' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">CONECTANDO</span>}
                                            {statuses[inst.instanceId] === 'close' && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">DISCONECTADO</span>}
                                        </div>
                                        <code className="text-xs text-slate-500 bg-black/50 px-2 py-1 rounded-md mt-2 inline-block">ID: {inst.instanceId}</code>
                                    </div>
                                    <button onClick={() => handleDelete(inst.id, inst.instanceId)} className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleLoadQr(inst.instanceId)}
                                    className="w-full mt-auto py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <QrCode size={18} />
                                    Forçar QR / Checar Conexão
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Guia de Documentação Real-time */}
            <IntegrationDocs type="EVOLUTION" />
        </div>
    );
}

import IntegrationDocs from '@/components/IntegrationDocs';
