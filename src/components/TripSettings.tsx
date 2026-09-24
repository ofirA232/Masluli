import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { useClosingDialog } from "@/hooks/useClosingDialog";
import { Button } from "./ui/button";
import { TravelersEditor } from "./TravelersEditor";
import { dayCount, dateOnly } from "@/lib/trips";
import { pruneTravelerRefs } from "@/lib/budget";
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
  const dialog = useClosingDialog(onClose);
  const [meta, setMeta] = useState(plan.metadata),
    [error, setError] = useState("");
  const inUse = new Set(
    plan.expenses.flatMap((e) => [
      ...(e.paidBy ? [e.paidBy] : []),
      ...Object.keys(e.split.shares),
    ]),
  );
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
    const travelersList = meta.travelersList.map((t, i) => ({
      ...t,
      name: t.name.trim() || `מטייל ${i + 1}`,
    }));
    onSave({
      ...plan,
      metadata: { ...meta, travelersList, travelers: travelersList.length },
      days,
      saved_places: saved,
      expenses: pruneTravelerRefs(plan.expenses, travelersList),
    });
    dialog.close();
  };
  return (
    <Dialog {...dialog.rootProps}>
      <DialogContent className="activity-dialog" {...dialog.contentProps}>
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
          <fieldset>
            <legend>מי נוסע ({meta.travelersList.length})</legend>
            <TravelersEditor
              value={meta.travelersList}
              inUse={inUse}
              onChange={(travelersList) =>
                setMeta({
                  ...meta,
                  travelersList,
                  travelers: travelersList.length,
                })
              }
            />
          </fieldset>
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
