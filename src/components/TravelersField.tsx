import { Minus, Plus, Users } from "lucide-react";
const MAX = 20;
// A stepper instead of a dropdown: the count is always visible and one tap
// away, which is what this field is for on a phone.
export function TravelersField({
  travelers,
  onChange,
}: {
  travelers: number;
  onChange: (travelers: number) => void;
}) {
  const set = (next: number) => onChange(Math.min(MAX, Math.max(1, next)));
  return (
    <div className="field travelers-field">
      <span>
        <Users size={16} />
        מי מצטרף?
      </span>
      <div className="stepper" role="group" aria-label="מספר מטיילים">
        <button
          type="button"
          aria-label="עוד מטיילים"
          disabled={travelers >= MAX}
          onClick={() => set(travelers + 1)}
        >
          <Plus size={15} />
        </button>
        <strong aria-live="polite">
          {travelers} {travelers === 1 ? "מטייל" : "מטיילים"}
        </strong>
        <button
          type="button"
          aria-label="פחות מטיילים"
          disabled={travelers <= 1}
          onClick={() => set(travelers - 1)}
        >
          <Minus size={15} />
        </button>
      </div>
    </div>
  );
}
