"use client";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#64748b",
];

export function IconColorPicker({
  icon,
  color,
  icons,
  onIconChange,
  onColorChange,
}: {
  icon: string;
  color: string;
  icons: string[];
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-sm font-medium text-muted">Иконка</p>
        <div className="flex flex-wrap gap-2">
          {icons.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIconChange(i)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
                icon === i ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-muted">Цвет</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              aria-label={c}
              className="h-8 w-8 rounded-full transition"
              style={{
                backgroundColor: c,
                outline: color === c ? "2px solid var(--foreground)" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
