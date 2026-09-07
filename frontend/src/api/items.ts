import type { Item, ItemInput } from "../types/item";
import { apiClient } from "./client";

export async function listItems(): Promise<Item[]> {
    const { data } = await apiClient.get<Item[]>("/items");
    return data;
}

export async function getItem(id: number): Promise<Item> {
    const { data } = await apiClient.get<Item>(`/items/${id}`);
    return data;
}

export async function createItem(payload: ItemInput): Promise<Item> {
    const { data } = await apiClient.post<Item>("/items", payload);
    return data;
}

export async function updateItem(
    id: number,
    payload: ItemInput,
): Promise<Item> {
    const { data } = await apiClient.put<Item>(`/items/${id}`, payload);
    return data;
}

export async function deleteItem(id: number): Promise<void> {
    await apiClient.delete(`/items/${id}`);
}
