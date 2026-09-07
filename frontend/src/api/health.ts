import type {
    DatabaseHealthResponse,
    FullHealthResponse,
    HealthResponse,
    StorageHealthResponse,
} from "../types/health";
import { apiClient } from "./client";

export async function getHealth(): Promise<HealthResponse> {
    const { data } = await apiClient.get<HealthResponse>("/health");
    return data;
}

export async function getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    const { data } = await apiClient.get<DatabaseHealthResponse>("/health/db");
    return data;
}

export async function getStorageHealth(): Promise<StorageHealthResponse> {
    const { data } = await apiClient.get<StorageHealthResponse>("/health/s3");
    return data;
}

export async function getFullHealth(): Promise<FullHealthResponse> {
    const { data } = await apiClient.get<FullHealthResponse>("/health/full");
    return data;
}
