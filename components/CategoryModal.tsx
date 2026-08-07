"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { IconColorPicker } from "@/components/IconColorPicker";
import { api } from "@/lib/api-client";
import { emitDataChanged } from "@/lib/events";
import type { Category } from "@/lib/types";

const CATEGORY_ICONS = [
  "🏷️",
  "🛒",
  "🍽️",
  "🚗",
  "🏠",
  "💡",
  "🛍️",
  "🎬",
  "📱",
  "💊",
  "🏋️",
  "📚",
  "✈️",
  "👨‍👩‍👧",
  "🎁",
  "🛡️",
  "💼",
  "💻",
  "📈",
  "💰",
  "📦",
];

export function CategoryModal({
  onClose,
  type,
  category,
}: {
  onClose: () => void;
  type: "expense" | "income";
  category?: Category;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState(category?.color ?? "#6366f1");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Введите название категории.");
      return;
    }
    setSaving(true);
    try {
      if (category) {
        await api.patch(`/api/categories/${category.id}`, { name: name.trim(), icon, color });
      } else {
        await api.post("/api/categories", { name: name.trim(), icon, color, type });
      }
      emitDataChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!category) return;
    if (!confirm("Удалить категорию?")) return;
    setSaving(true);
    try {
      await api.delete(`/api/categories/${category.id}`);
      emitDataChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={category ? "Редактировать категорию" : "Новая категория"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted">Название</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
        </div>

        <IconColorPicker
          icon={icon}
          color={color}
          icons={CATEGORY_ICONS}
          onIconChange={setIcon}
          onColorChange={setColor}
        />

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="mt-2 flex gap-2">
          {category && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 rounded-xl border border-border py-3.5 text-sm font-medium text-expense transition active:scale-[0.98] disabled:opacity-60"
            >
              Удалить
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-primary py-3.5 text-base font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
