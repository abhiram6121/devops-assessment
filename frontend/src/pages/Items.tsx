import { useEffect, useState } from "react";
import { getErrorMessage } from "../api/client";
import { createItem, deleteItem, listItems, updateItem } from "../api/items";
import ItemTable from "../components/ItemTable";
import type { Item, ItemInput } from "../types/item";

export default function Items() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function refresh() {
        setLoading(true);
        setError(null);
        try {
            const data = await listItems();
            setItems(data);
        } catch (err) {
            setError(getErrorMessage(err, "Unable to load items."));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleCreate(payload: ItemInput) {
        await createItem(payload);
        await refresh();
    }

    async function handleUpdate(id: number, payload: ItemInput) {
        await updateItem(id, payload);
        await refresh();
    }

    async function handleDelete(id: number) {
        try {
            await deleteItem(id);
            await refresh();
        } catch (err) {
            setError(getErrorMessage(err, "Unable to delete item."));
        }
    }

    return (
        <div>
            <h1>Items</h1>
            <p className="page-subtitle">
                Non-file backend records used to exercise the API and database.
            </p>
            {error && <p className="error-text">{error}</p>}
            {loading ? (
                <p>Loading items…</p>
            ) : (
                <ItemTable
                    items={items}
                    onCreate={handleCreate}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
