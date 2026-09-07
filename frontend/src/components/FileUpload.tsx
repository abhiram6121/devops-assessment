import { useRef, useState } from "react";

interface FileUploadProps {
    onUpload: (file: File) => Promise<void>;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
    const [selected, setSelected] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleUpload() {
        if (!selected) return;
        setUploading(true);
        setError(null);
        try {
            await onUpload(selected);
            setSelected(null);
            if (inputRef.current) inputRef.current.value = "";
        } catch {
            setError("File upload failed.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="file-upload">
            <div className="file-upload-controls">
                <input
                    ref={inputRef}
                    type="file"
                    onChange={(e) => setSelected(e.target.files?.[0] ?? null)}
                />
                <button
                    onClick={handleUpload}
                    disabled={!selected || uploading}
                >
                    {uploading ? "Uploading…" : "Upload"}
                </button>
            </div>
            {error && <p className="error-text">{error}</p>}
        </div>
    );
}
