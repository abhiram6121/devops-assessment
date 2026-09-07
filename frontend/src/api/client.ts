import axios from "axios";

// Include VITE_API_BASE_URL in the environment or as secret in CI
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

/**
 * Extracts a human-readable message from an Axios/FastAPI error response,
 * falling back to a generic message. Never surfaces stack traces.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string") {
            return detail;
        }
        if (error.code === "ECONNABORTED" || !error.response) {
            return "Unable to connect to backend.";
        }
    }
    return fallback;
}
