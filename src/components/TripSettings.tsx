import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { dayCount, dateOnly } from "@/lib/trips";
import type { TripPlan } from "@/types/itinerary";
export function TripSettings({
  plan,
  onSave,
  onClose,
}: {
  plan: TripPlan;
  onSave: (p: TripPlan) => void;
  onClose: () => void;
}) {
  const [meta, setMeta] = useState(plan.metadata),
    [error, setError] = useState("");
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    let days = plan.days,
      saved = plan.saved_places;
    if (meta.startDate || meta.endDate) {
      if (!dateOnly(meta.startDate) || !dateOnly(meta.endDate)) {
        setError("יש לבחור את שני התאריכים");
        return;
      }
      const count = dayCount(meta.startDate!, meta.endDate!);
      if (count < 1 || count > 30) {
        setError("הטיול יכול לכלול יום אחד עד 30 ימים");
        return;
      }
      const overflow = days.slice(count).flatMap((d) => d.activities);
      if (
        overflow.length &&
        !window.confirm(
          "הימים שיוסרו כוללים תחנות. להעביר אותן למקומות ששמרתי?",
        )
      )
        return;
      saved = [...saved, ...overflow];
      days = Array.from(
        { length: count },
        (_, i) => days[i] || { day_number: i + 1, activities: [] },
      );
    }
    onSave({ ...plan, metadata: meta, days, saved_places: saved });
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent>
        <DialogTitle>פרטי הטיול</DialogTitle>
        <DialogDescription>
          הטיול משתנה איתכם. שינוי התאריכים שומר את התחנות שלכם.
        </DialogDescription>
        <form onSubmit={save}>
          <label className="field">
            <span>שם הטיול</span>
            <input
              required
              maxLength={150}
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            />
          </label>
          <div className="editor-fields">
            <label className="field">
              <span>תאריך התחלה</span>
              <input
                type="date"
                value={meta.startDate || ""}
                onChange={(e) =>
                  setMeta({ ...meta, startDate: e.target.value || null })
                }
              />
            </label>
            <label className="field">
              <span>תאריך סיום</span>
              <input
                type="date"
                value={meta.endDate || ""}
                onChange={(e) =>
                  setMeta({ ...meta, endDate: e.target.value || null })
                }
              />
            </label>
            <label className="field">
              <span>מספר מטיילים</span>
              <input
                type="number"
                required
                min="1"
                max="20"
                value={meta.travelers}
                onChange={(e) =>
                  setMeta({ ...meta, travelers: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>תקציב בשקלים</span>
              <input
                type="number"
                min="0"
                max="10000000"
                value={meta.targetBudget ?? ""}
                onChange={(e) =>
                  setMeta({
                    ...meta,
                    targetBudget:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button className="w-full mt-4">שמירת פרטי הטיול</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
