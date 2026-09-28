import { Minus, Plus, Users } from "lucide-react";
import { useT } from "@/i18n";
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
  const words = useT().trip.travelers;
  const set = (next: number) => onChange(Math.min(MAX, Math.max(1, next)));
  return (
    <div className="field travelers-field">
      <span>
        <Users size={16} />
        {words.who}
      </span>
      <div className="stepper" role="group" aria-label={words.stepper}>
        <button
          type="button"
          aria-label={words.more}
          disabled={travelers >= MAX}
          onClick={() => set(travelers + 1)}
        >
          <Plus size={15} />
        </button>
        <strong aria-live="polite">{words.count(travelers)}</strong>
        <button
          type="button"
          aria-label={words.fewer}
          disabled={travelers <= 1}
          onClick={() => set(travelers - 1)}
        >
          <Minus size={15} />
        </button>
      </div>
    </div>
  );
}
