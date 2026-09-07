import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import {
    deleteFile,
    getFileDownload,
    listFiles,
    uploadFile,
} from "../api/files";
import FileTable from "../components/FileTable";
import FileUpload from "../components/FileUpload";
import type { FileItem } from "../types/file";

export default function Files() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openingId, setOpeningId] = useState<number | null>(null);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const data = await listFiles();
            setFiles(data);
        } catch (err) {
            setError(getErrorMessage(err, "Unable to load files."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleUpload(file: File) {
        setError(null);
        try {
            await uploadFile(file);
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err, "File upload failed."));
            throw err;
        }
    }

    async function handleOpen(id: number) {
        setError(null);
        setOpeningId(id);
        try {
            const { url } = await getFileDownload(id);
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (err) {
            setError(getErrorMessage(err, "Unable to retrieve file."));
        } finally {
            setOpeningId(null);
        }
    }

    async function handleDelete(id: number) {
        setError(null);
        try {
            await deleteFile(id);
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err, "Unable to delete file."));
        }
    }

    return (
        <div>
            <h1>Files</h1>
            <p className="page-subtitle">
                Upload, download, and delete files backed by S3-compatible
                storage.
            </p>
            <FileUpload onUpload={handleUpload} />
            {error && <p className="error-text">{error}</p>}
            {loading ? (
                <p>Loading files…</p>
            ) : (
                <FileTable
                    files={files}
                    onOpen={handleOpen}
                    onDelete={handleDelete}
                    openingId={openingId}
                />
            )}
        </div>
    );
}
