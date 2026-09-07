export interface FileItem {
    id: number;
    filename: string;
    content_type: string;
    size: number;
    created_at: string;
}

export interface FileDownload {
    id: number;
    filename: string;
    url: string;
}
