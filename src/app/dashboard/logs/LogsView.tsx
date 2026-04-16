'use client';

import { useState, useEffect } from 'react';
import { getWebhookLogs, clearWebhookLogs } from './actions';
import { 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  RefreshCw, 
  Terminal,
  Clock,
  ExternalLink
} from 'lucide-react';

interface WebhookLog {
  id: string;
  provider: string;
  event: string | null;
  payload: string;
  createdAt: Date;
}

export default function LogsView({ workspaceId }: { workspaceId: string }) {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getWebhookLogs(workspaceId);
      setLogs(data as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Tem certeza que deseja limpar todos os logs?')) {
      await clearWebhookLogs(workspaceId);
      fetchLogs();
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [workspaceId]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="text-blue-400" />
            Logs de Webhook
          </h1>
          <p className="text-gray-400 text-sm">
            Histórico bruto de todas as requisições recebidas (WABA e Evolution).
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchLogs}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            title="Atualizar"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleClear}
            className="p-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
            title="Limpar tudo"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">Nenhum log registrado ainda.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map((log) => (
              <div key={log.id} className="group">
                <button
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors text-left"
                >
                  {expandedId === log.id ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                  
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    log.provider === 'WABA' ? 'bg-green-900/50 text-green-400 border border-green-800/50' : 'bg-blue-900/50 text-blue-400 border border-blue-800/50'
                  }`}>
                    {log.provider}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-gray-200 font-medium block truncate">
                      {log.event || 'Evento desconhecido'}
                    </span>
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </button>

                {expandedId === log.id && (
                  <div className="p-4 bg-black/40 border-t border-gray-800">
                    <pre className="text-[12px] font-mono text-blue-300 overflow-x-auto p-4 bg-gray-950 rounded-lg">
                      {JSON.stringify(JSON.parse(log.payload), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
