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
import { preferenceOptions } from "@/lib/preferences";
import type { TravelPreferences } from "@/types/profile";
import { Choices } from "./Choices";
import { useLang, useT } from "@/i18n";
export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const dialog = useClosingDialog(onClose);
  const { preferences, loaded, save } = useTravelerProfile();
  const words = useT(),
    t = words.profile,
    { lang } = useLang(),
    options = preferenceOptions(lang);
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
      toast.success(t.saved);
      dialog.close();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : words.common.errors.saveFailedShort,
      );
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
        <DialogTitle>{t.title}</DialogTitle>
        <DialogDescription>{t.description}</DialogDescription>
        <form onSubmit={submit} className="profile-form">
          <Choices
            label={t.pace}
            options={options.pace}
            value={form.pace}
            onChange={(pace) => setForm({ ...form, pace })}
          />
          <Choices
            label={t.budget}
            options={options.budget}
            value={form.budget}
            onChange={(budget) => setForm({ ...form, budget })}
          />
          <Choices
            label={t.mobility}
            options={options.mobility}
            value={form.mobility}
            onChange={(mobility) => setForm({ ...form, mobility })}
          />
          <Choices
            label={t.gettingAround}
            options={options.gettingAround}
            value={form.getting_around}
            onChange={(getting_around) => setForm({ ...form, getting_around })}
          />
          <div className="choice-group" role="group" aria-label={t.food}>
            <h3>{t.food}</h3>
            <div>
              {options.food.map((o) => (
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
          <div className="choice-group" role="group" aria-label={t.interests}>
            <h3>{t.interests}</h3>
            <div>
              {options.interests.map(({ value: i, label }) => (
                <button
                  type="button"
                  key={i}
                  aria-pressed={form.interests.includes(i)}
                  className={form.interests.includes(i) ? "selected" : ""}
                  onClick={() =>
                    setForm({ ...form, interests: toggle(form.interests, i) })
                  }
                >
                  {label}
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
            <span>{t.kids}</span>
          </label>
          <label className="field">
            <span>{t.petPeeves}</span>
            <textarea
              maxLength={300}
              placeholder={t.petPeevesPlaceholder}
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
            {t.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
