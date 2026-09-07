export interface HealthResponse {
    status: string;
    service: string;
}

export interface DatabaseHealthResponse {
    status: string;
    database: string;
    detail?: string | null;
}

export interface StorageHealthResponse {
    status: string;
    storage: string;
    bucket: string;
    detail?: string | null;
}

export interface FullHealthResponse {
    status: string;
    backend: string;
    database: string;
    storage: string;
}
