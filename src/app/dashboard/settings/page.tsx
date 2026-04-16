import { getWorkspaceSettings } from './actions';
import SettingsView from './SettingsView';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const settings = await getWorkspaceSettings();

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto w-full mx-auto p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-black text-white flex items-center gap-4">
                            <span className="bg-gradient-to-br from-indigo-400 to-purple-500 bg-clip-text text-transparent">Configurações Gerais</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg font-light max-w-2xl">
                            Gerencie os parâmetros do seu Workspace e conecte os neurônios do Google Gemini.
                        </p>
                    </div>

                    <SettingsView settings={settings} />
                </div>
            </div>
        </div>
    );
}
