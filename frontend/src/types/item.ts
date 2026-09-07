export type ItemStatus = "active" | "inactive";

export interface Item {
    id: number;
    name: string;
    description: string | null;
    status: ItemStatus;
    created_at: string;
    updated_at: string;
}

export interface ItemInput {
    name: string;
    description: string | null;
    status: ItemStatus;
}
