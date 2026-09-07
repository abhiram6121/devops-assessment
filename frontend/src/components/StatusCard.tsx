export type StatusCardState = "loading" | "ok" | "error";

interface StatusCardProps {
    title: string;
    state: StatusCardState;
    okLabel: string;
    errorLabel: string;
    detail?: string | null;
}

export default function StatusCard({
    title,
    state,
    okLabel,
    errorLabel,
    detail,
}: StatusCardProps) {
    return (
        <div className={`status-card status-card--${state}`}>
            <div className="status-card-title">{title}</div>
            <div className="status-card-value">
                {state === "loading" && <span>Checking…</span>}
                {state === "ok" && <span>✓ {okLabel}</span>}
                {state === "error" && <span>✗ {errorLabel}</span>}
            </div>
            {state === "error" && detail && (
                <div className="status-card-detail">{detail}</div>
            )}
        </div>
    );
}
