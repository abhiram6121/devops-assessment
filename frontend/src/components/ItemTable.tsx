import { Fragment, useState } from "react";
import type { Item, ItemInput, ItemStatus } from "../types/item";

interface ItemTableProps {
    items: Item[];
    onCreate: (payload: ItemInput) => Promise<void>;
    onUpdate: (id: number, payload: ItemInput) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

const emptyForm: ItemInput = { name: "", description: "", status: "active" };

export default function ItemTable({
    items,
    onCreate,
    onUpdate,
    onDelete,
}: ItemTableProps) {
    const [form, setForm] = useState<ItemInput>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    function startEdit(item: Item) {
        setEditingId(item.id);
        setExpandedId(null);
        setForm({
            name: item.name,
            description: item.description ?? "",
            status: item.status,
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyForm);
        setFormError(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        if (!form.name.trim()) {
            setFormError("Name is required.");
            return;
        }
        setSubmitting(true);
        try {
            if (editingId !== null) {
                await onUpdate(editingId, form);
            } else {
                await onCreate(form);
            }
            setForm(emptyForm);
            setEditingId(null);
        } catch {
            setFormError(
                editingId !== null
                    ? "Unable to update item."
                    : "Unable to create item.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="panel">
            <form className="item-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={form.description ?? ""}
                    onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                    }
                />
                <select
                    value={form.status}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            status: e.target.value as ItemStatus,
                        })
                    }
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
                <button type="submit" disabled={submitting}>
                    {editingId !== null ? "Save" : "Add item"}
                </button>
                {editingId !== null && (
                    <button
                        type="button"
                        className="secondary"
                        onClick={cancelEdit}
                    >
                        Cancel
                    </button>
                )}
            </form>
            {formError && <p className="error-text">{formError}</p>}

            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={3} className="empty-row">
                                No items yet.
                            </td>
                        </tr>
                    )}
                    {items.map((item) => (
                        <Fragment key={item.id}>
                            <tr>
                                <td>{item.name}</td>
                                <td>
                                    <span
                                        className={`badge badge--${item.status}`}
                                    >
                                        {item.status === "active"
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <button
                                        className="link-button"
                                        onClick={() =>
                                            setExpandedId(
                                                expandedId === item.id
                                                    ? null
                                                    : item.id,
                                            )
                                        }
                                    >
                                        View
                                    </button>
                                    <button
                                        className="link-button"
                                        onClick={() => startEdit(item)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="link-button danger"
                                        onClick={() => onDelete(item.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                            {expandedId === item.id && (
                                <tr className="detail-row">
                                    <td colSpan={3}>
                                        <div className="detail-box">
                                            <div>
                                                <strong>Description:</strong>{" "}
                                                {item.description || "—"}
                                            </div>
                                            <div>
                                                <strong>Created:</strong>{" "}
                                                {new Date(
                                                    item.created_at,
                                                ).toLocaleString()}
                                            </div>
                                            <div>
                                                <strong>Updated:</strong>{" "}
                                                {new Date(
                                                    item.updated_at,
                                                ).toLocaleString()}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
