import type { FileItem } from "../types/file";

interface FileTableProps {
    files: FileItem[];
    onOpen: (id: number) => void;
    onDelete: (id: number) => void;
    openingId: number | null;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeLabel(contentType: string): string {
    const [, subtype] = contentType.split("/");
    return (subtype || contentType).toUpperCase();
}

export default function FileTable({
    files,
    onOpen,
    onDelete,
    openingId,
}: FileTableProps) {
    return (
        <table className="data-table">
            <thead>
                <tr>
                    <th>Filename</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {files.length === 0 && (
                    <tr>
                        <td colSpan={4} className="empty-row">
                            No files uploaded yet.
                        </td>
                    </tr>
                )}
                {files.map((file) => (
                    <tr key={file.id}>
                        <td>{file.filename}</td>
                        <td>{formatSize(file.size)}</td>
                        <td>{typeLabel(file.content_type)}</td>
                        <td className="actions-cell">
                            <button
                                className="link-button"
                                onClick={() => onOpen(file.id)}
                                disabled={openingId === file.id}
                            >
                                {openingId === file.id ? "Opening…" : "Open"}
                            </button>
                            <button
                                className="link-button danger"
                                onClick={() => onDelete(file.id)}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
