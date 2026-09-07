import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import { getDatabaseHealth, getHealth, getStorageHealth } from "../api/health";
import StatusCard, { type StatusCardState } from "../components/StatusCard";

interface CardState {
    state: StatusCardState;
    detail?: string | null;
}

const initial: CardState = { state: "loading" };

export default function Dashboard() {
    const [backend, setBackend] = useState<CardState>(initial);
    const [database, setDatabase] = useState<CardState>(initial);
    const [storage, setStorage] = useState<CardState>(initial);
    const [api, setApi] = useState<CardState>(initial);

    useEffect(() => {
        let cancelled = false;

        getHealth()
            .then(() => {
                if (!cancelled) {
                    setBackend({ state: "ok" });
                    setApi({ state: "ok" });
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setBackend({
                        state: "error",
                        detail: getErrorMessage(
                            err,
                            "Unable to connect to backend.",
                        ),
                    });
                    setApi({
                        state: "error",
                        detail: "Unable to connect to backend.",
                    });
                }
            });

        getDatabaseHealth()
            .then((res) =>
                setDatabase(
                    res.status === "ok"
                        ? { state: "ok" }
                        : {
                              state: "error",
                              detail: res.detail ?? "Database unavailable.",
                          },
                ),
            )
            .catch((err) =>
                setDatabase({
                    state: "error",
                    detail: getErrorMessage(err, "Unable to reach database."),
                }),
            );

        getStorageHealth()
            .then((res) =>
                setStorage(
                    res.status === "ok"
                        ? { state: "ok" }
                        : {
                              state: "error",
                              detail: res.detail ?? "Storage unavailable.",
                          },
                ),
            )
            .catch((err) =>
                setStorage({
                    state: "error",
                    detail: getErrorMessage(err, "Unable to reach storage."),
                }),
            );

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            <h1>Dashboard</h1>
            <p className="page-subtitle">
                Live status of the backend, database, and object storage.
            </p>
            <div className="status-grid">
                <StatusCard
                    title="Backend"
                    state={backend.state}
                    okLabel="Operational"
                    errorLabel="Unreachable"
                    detail={backend.detail}
                />
                <StatusCard
                    title="Database"
                    state={database.state}
                    okLabel="Connected"
                    errorLabel="Disconnected"
                    detail={database.detail}
                />
                <StatusCard
                    title="Storage"
                    state={storage.state}
                    okLabel="Connected"
                    errorLabel="Disconnected"
                    detail={storage.detail}
                />
                <StatusCard
                    title="API"
                    state={api.state}
                    okLabel="Operational"
                    errorLabel="Unreachable"
                    detail={api.detail}
                />
            </div>
        </div>
    );
}
