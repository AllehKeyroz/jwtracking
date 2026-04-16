import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWabaConnection } from "./actions";
import WabaClient from "./WabaClient";

export default async function WabaIntegrationPage() {
    const session = await getServerSession(authOptions);
    const workspaceId = session?.user?.workspaceId || '';

    const initialData = await getWabaConnection();

    return (
        <WabaClient
            workspaceId={workspaceId}
            initialData={initialData}
        />
    );
}
