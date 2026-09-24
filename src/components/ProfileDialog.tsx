import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { useClosingDialog } from "@/hooks/useClosingDialog";
import { Button } from "./ui/button";
import { useTravelerProfile } from "@/hooks/useTravelerProfile";
import {
  budgetOptions,
  foodOptions,
  interestOptions,
  mobilityOptions,
  paceOptions,
} from "@/lib/preferences";
import type { TravelPreferences } from "@/types/profile";
function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T | null) => void;
}) {
  return (
    <div className="choice-group" role="group" aria-label={label}>
      <h3>{label}</h3>
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
export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const dialog = useClosingDialog(onClose);
  const { preferences, loaded, save } = useTravelerProfile();
  const [form, setForm] = useState<TravelPreferences>(preferences);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  // Adopt the stored profile once it arrives, unless the user already typed.
  useEffect(() => {
    if (loaded) setForm(preferences);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
  const toggle = <T extends string>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await save(form);
      toast.success("ההעדפות נשמרו. ההצעות הבאות כבר יתאימו לכם.");
      dialog.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "השמירה נכשלה");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog {...dialog.rootProps}>
      <DialogContent
        className="activity-dialog profile-dialog"
        {...dialog.contentProps}
      >
        <DialogTitle>איך אתם אוהבים לטייל?</DialogTitle>
        <DialogDescription>
          כמה בחירות קצרות. הפרטים פרטיים ומשפיעים על כל הצעה של ה־AI.
        </DialogDescription>
        <form onSubmit={submit} className="profile-form">
          <Choices
            label="קצב"
            options={paceOptions}
            value={form.pace}
            onChange={(pace) => setForm({ ...form, pace })}
          />
          <Choices
            label="רמת תקציב"
            options={budgetOptions}
            value={form.budget}
            onChange={(budget) => setForm({ ...form, budget })}
          />
          <Choices
            label="ניידות"
            options={mobilityOptions}
            value={form.mobility}
            onChange={(mobility) => setForm({ ...form, mobility })}
          />
          <div className="choice-group" role="group" aria-label="אוכל">
            <h3>אוכל</h3>
            <div>
              {foodOptions.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  aria-pressed={form.food.includes(o.value)}
                  className={form.food.includes(o.value) ? "selected" : ""}
                  onClick={() =>
                    setForm({ ...form, food: toggle(form.food, o.value) })
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="choice-group" role="group" aria-label="מה מעניין אתכם">
            <h3>מה מעניין אתכם</h3>
            <div>
              {interestOptions.map((i) => (
                <button
                  type="button"
                  key={i}
                  aria-pressed={form.interests.includes(i)}
                  className={form.interests.includes(i) ? "selected" : ""}
                  onClick={() =>
                    setForm({ ...form, interests: toggle(form.interests, i) })
                  }
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.kids}
              onChange={(e) => setForm({ ...form, kids: e.target.checked })}
            />
            <span>מטיילים עם ילדים</span>
          </label>
          <label className="field">
            <span>מה מעצבן אתכם בטיולים? (לא חובה)</span>
            <textarea
              maxLength={300}
              placeholder="תורים ארוכים, מקומות תיירותיים מדי, קימה מוקדמת…"
              value={form.pet_peeves}
              onChange={(e) => setForm({ ...form, pet_peeves: e.target.value })}
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full mt-4" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
            שמירת ההעדפות
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
