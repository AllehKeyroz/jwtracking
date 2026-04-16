'use client';

import { useState } from 'react';
import { updateWorkspaceAiSettings, testGeminiConnection, testOpenRouterConnection } from './actions';
import { Save, Brain, ShieldCheck, Eye, EyeOff, Sparkles, Activity, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsView({ settings }: { settings: any }) {
    const [geminiKey, setGeminiKey] = useState(settings?.geminiApiKey || '');
    const [geminiModel, setGeminiModel] = useState(settings?.geminiModel || 'gemini-3-flash-latest');

    const [orKey, setOrKey] = useState(settings?.openRouterKey || '');
    const [orModel, setOrModel] = useState(settings?.openRouterModel || 'xiaomi/mimo-v2-flash:free');

    const [showGemini, setShowGemini] = useState(false);
    const [showOR, setShowOR] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testingGemini, setTestingGemini] = useState(false);
    const [testingOR, setTestingOR] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleTestGemini = async () => {
        setTestingGemini(true);
        setMessage({ type: '', text: '' });
        try {
            await testGeminiConnection(geminiKey, geminiModel);
            setMessage({ type: 'success', text: `Gemini OK! Respondendo via ${geminiModel}.` });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setTestingGemini(false);
        }
    };

    const handleTestOR = async () => {
        setTestingOR(true);
        setMessage({ type: '', text: '' });
        try {
            await testOpenRouterConnection(orKey, orModel);
            setMessage({ type: 'success', text: `OpenRouter OK! Respondendo via ${orModel}.` });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setTestingOR(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await updateWorkspaceAiSettings({
                geminiApiKey: geminiKey,
                geminiModel: geminiModel,
                openRouterKey: orKey,
                openRouterModel: orModel
            });
            setMessage({ type: 'success', text: 'Todas as configurações de IA foram salvas ocupando seu workspace.' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message || 'Erro ao salvar.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <Brain className="text-indigo-400" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                I.A. Gemini "Secrets"
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Fase 5</span>
                            </h2>
                            <p className="text-slate-400 text-sm">Configure sua chave de API para ativar a análise estruturada de leads.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                        <ShieldCheck className="text-amber-500 flex-shrink-0" size={20} />
                        <div className="text-xs text-amber-200/80 leading-relaxed">
                            <p className="font-bold mb-1">Privacidade de Dados:</p>
                            Sua chave de API é armazenada de forma segura e utilizada apenas para processar os chats do seu workspace.
                            O KDS Tracker não compartilha seus dados de treinamento com outros tenants.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Coluna Gemini */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Brain className="text-indigo-400" size={24} />
                                <h3 className="text-xl font-bold text-white">Google Gemini</h3>
                            </div>

                            <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400">Modelo</label>
                                    <select
                                        value={geminiModel}
                                        onChange={(e) => setGeminiModel(e.target.value)}
                                        className="w-full bg-black border border-white/10 text-white rounded-xl p-3 text-sm focus:border-indigo-500 transition-colors"
                                    >
                                        <optgroup label="Série Gemini 3.1 (2026)">
                                            <option value="gemini-3.1-pro-latest">Gemini 3.1 Pro (Recomendado)</option>
                                            <option value="gemini-3-flash-latest">Gemini 3 Flash (Alta Velocidade)</option>
                                            <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash-Lite (Preview)</option>
                                        </optgroup>
                                        <optgroup label="Série Gemini 2.5 (Estáveis)">
                                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showGemini ? "text" : "password"}
                                            value={geminiKey}
                                            onChange={(e) => setGeminiKey(e.target.value)}
                                            placeholder="AIza..."
                                            className="w-full bg-black border border-white/10 text-white rounded-xl p-3 pr-12 text-sm font-mono focus:border-indigo-500"
                                        />
                                        <button onClick={() => setShowGemini(!showGemini)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                            {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleTestGemini}
                                    disabled={testingGemini || !geminiKey}
                                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl text-xs font-bold border border-white/5 transition-all"
                                >
                                    {testingGemini ? "Testando..." : <><Activity size={14} className="text-emerald-400" /> Testar Gemini</>}
                                </button>
                            </div>
                        </div>

                        {/* Coluna OpenRouter */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Globe className="text-orange-400" size={24} />
                                <h3 className="text-xl font-bold text-white">OpenRouter</h3>
                            </div>

                            <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400">Modelo Gratuito (Free)</label>
                                    <select
                                        value={orModel}
                                        onChange={(e) => setOrModel(e.target.value)}
                                        className="w-full bg-black border border-white/10 text-white rounded-xl p-3 text-sm focus:border-orange-500 transition-colors"
                                    >
                                        <option value="openrouter/free">Auto-Free (Escolha automática)</option>
                                        <optgroup label="Fronteira Gratuita">
                                            <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B Instruct</option>
                                            <option value="deepseek/deepseek-r1-0528:free">DeepSeek R1 (Thinking)</option>
                                            <option value="google/gemma-3-27b-it:free">Gemma 3 27B IT</option>
                                        </optgroup>
                                        <optgroup label="Rápidos e Flash">
                                            <option value="google/gemini-2.0-flash:free">Gemini 2.0 Flash</option>
                                            <option value="mistralai/mistral-small-3.1-24b-instruct:free">Mistral Small 3.1</option>
                                        </optgroup>
                                        <optgroup label="Especializados">
                                            <option value="mistralai/devstral-2512:free">Devstral 2 (Coding)</option>
                                            <option value="qwen/qwen3-vl-30b-a3b-thinking:free">Qwen 3 VL Thinking</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400">API Key</label>
                                    <div className="relative">
                                        <input
                                            type={showOR ? "text" : "password"}
                                            value={orKey}
                                            onChange={(e) => setOrKey(e.target.value)}
                                            placeholder="sk-or-v1-..."
                                            className="w-full bg-black border border-white/10 text-white rounded-xl p-3 pr-12 text-sm font-mono focus:border-orange-500"
                                        />
                                        <button onClick={() => setShowOR(!showOR)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                            {showOR ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleTestOR}
                                    disabled={testingOR || !orKey}
                                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl text-xs font-bold border border-white/5 transition-all"
                                >
                                    {testingOR ? "Testando..." : <><Activity size={14} className="text-orange-400" /> Testar OpenRouter</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/10">
                        <button
                            onClick={handleSave}
                            disabled={loading || testingGemini || testingOR}
                            className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-10 py-4 rounded-xl font-black transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(99,102,241,0.3)] uppercase tracking-widest text-sm"
                        >
                            {loading ? "Sincronizando..." : <><Save size={20} /> Salvar Configurações Globais</>}
                        </button>
                    </div>

                    {message.text && (
                        <div className={cn(
                            "p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2",
                            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-cyan-400" />
                        O que a I.A. analisa?
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            Nível de Intenção (Frio, Morno, Quente)
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            Detecção de Objeções (Preço, Confiança, etc)
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            Status de Fechamento (Deal Closed)
                        </li>
                        <li className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            Estimativa de Valor da Venda
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
