// A row of chips for one optional choice; tapping the chosen one clears it.
export function Choices<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  return (
    <div className="choice-group" role="group" aria-label={label}>
      <h3>{label}</h3>
      {hint && <p>{hint}</p>}
      <div>
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            aria-pressed={value === o.value}
            className={value === o.value ? "selected" : ""}
            onClick={() => onChange(value === o.value ? null : o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
