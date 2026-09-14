import { Plus, X } from "lucide-react";
import { addTraveler } from "@/lib/budget";
import type { Traveler } from "@/types/itinerary";
/** Names of the people on the trip. Ids stay stable so expenses keep pointing at them. */
export function TravelersEditor({
  value,
  onChange,
  inUse,
}: {
  value: Traveler[];
  onChange: (next: Traveler[]) => void;
  /** Travelers referenced by expenses; removing one asks for confirmation. */
  inUse?: Set<string>;
}) {
  return (
    <div className="travelers-editor">
      {value.map((t, i) => (
        <div key={t.id} className="traveler-row">
          <input
            aria-label={`שם מטייל ${i + 1}`}
            maxLength={40}
            value={t.name}
            onChange={(e) =>
              onChange(
                value.map((v) =>
                  v.id === t.id ? { ...v, name: e.target.value } : v,
                ),
              )
            }
          />
          <button
            type="button"
            aria-label={`הסרת ${t.name}`}
            disabled={value.length <= 1}
            onClick={() => {
              if (
                inUse?.has(t.id) &&
                !window.confirm(
                  `${t.name} מופיע/ה בהוצאות. ההוצאות יישארו בלי משלם/ת. להסיר?`,
                )
              )
                return;
              onChange(value.filter((v) => v.id !== t.id));
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="add-traveler"
        disabled={value.length >= 20}
        onClick={() => onChange(addTraveler(value))}
      >
        <Plus size={14} />
        הוספת מטייל
      </button>
    </div>
  );
}
