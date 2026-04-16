import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getEvolutionConnections } from "./actions";
import EvolutionClientManager from "./EvolutionDashboard";

export default async function EvolutionIntegrationPage() {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || '';

    // Fetch initial connections mapping from db
    const connections = await getEvolutionConnections() || [];

    return (
        <EvolutionClientManager
            initialConnections={connections}
            workspaceId={workspaceId}
        />
    );
}
