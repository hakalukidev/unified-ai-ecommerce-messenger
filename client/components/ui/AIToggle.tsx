interface Props {
  enabled: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
  label?: string;
}

export function AIToggle({
  enabled,
  onToggle,
  size = "md",
  disabled = false,
  label = "Toggle AI auto-reply",
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex items-center rounded-full transition ${
        size === "sm" ? "h-5 w-9" : "h-6 w-11"
      } ${
        enabled
          ? "bg-[var(--color-accent)]"
          : "bg-[rgba(95,108,123,0.28)]"
      } disabled:cursor-not-allowed disabled:opacity-55`}
    >
      <span
        className={`inline-block rounded-full bg-white shadow transition-transform ${
          size === "sm" ? "h-4 w-4" : "h-5 w-5"
        } ${enabled ? (size === "sm" ? "translate-x-4" : "translate-x-5") : "translate-x-0.5"}`}
      />
    </button>
  );
}
