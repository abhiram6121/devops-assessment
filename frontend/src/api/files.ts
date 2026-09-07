import type { FileDownload, FileItem } from "../types/file";
import { apiClient } from "./client";

export async function listFiles(): Promise<FileItem[]> {
    const { data } = await apiClient.get<FileItem[]>("/files");
    return data;
}

export async function uploadFile(file: File): Promise<FileItem> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<FileItem>("/files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

export async function getFileDownload(id: number): Promise<FileDownload> {
    const { data } = await apiClient.get<FileDownload>(`/files/${id}`);
    return data;
}

export async function deleteFile(id: number): Promise<void> {
    await apiClient.delete(`/files/${id}`);
}
