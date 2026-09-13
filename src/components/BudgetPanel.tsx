import { useState } from "react";
import { Plus, Trash2, Wallet, ArrowDownLeft } from "lucide-react";
import { Button } from "./ui/button";
import { budgetTotals, categories, money, uid } from "@/lib/trips";
import type { Category, TripPlan } from "@/types/itinerary";
export function BudgetPanel({
  plan,
  edit,
  readOnly,
}: {
  plan: TripPlan;
  edit: (next: TripPlan) => void;
  readOnly: boolean;
}) {
  const totals = budgetTotals(plan),
    target = plan.metadata.targetBudget;
  const [label, setLabel] = useState(""),
    [amount, setAmount] = useState(""),
    [category, setCategory] = useState<Category>("restaurant"),
    [activityId, setActivityId] = useState("");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !label.trim() ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) < 0
    )
      return;
    edit({
      ...plan,
      expenses: [
        ...plan.expenses,
        {
          id: uid(),
          label: label.trim(),
          amount: Number(amount),
          category,
          activityId: activityId || undefined,
        },
      ],
    });
    setLabel("");
    setAmount("");
  };
  return (
    <section className="budget-panel">
      <div className="panel-title">
        <span className="feature-icon">
          <Wallet />
        </span>
        <div>
          <h2>מקום גם לתקציב</h2>
          <p>תמונה ברורה של מה שמתוכנן ומה שכבר הוצאתם.</p>
        </div>
      </div>
      <div className="budget-stats">
        <div>
          <span>התקציב שלכם</span>
          <strong>{target === null ? "עוד לא הוגדר" : money(target)}</strong>
        </div>
        <div>
          <span>אומדן מתוכנן</span>
          <strong>
            {!plan.days.some((d) => d.activities.some((a) => a.estimate))
              ? "עדיין לא ידוע"
              : totals.min === totals.max
                ? money(totals.min)
                : `${money(totals.min)}–${money(totals.max)}`}
          </strong>
          <small>
            {totals.unknown > 0
              ? `חסרה עלות ל־${totals.unknown} תחנות`
              : "כולל כל התחנות במסלול"}
          </small>
        </div>
        <div>
          <span>הוצאות בפועל</span>
          <strong>{money(totals.actual)}</strong>
          <small>ללא חיבור האומדנים לסכום זה</small>
        </div>
      </div>
      {target !== null && target > 0 && (
        <div className="budget-progress">
          <div>
            <span>מתוך התקציב</span>
            <strong>{Math.round((totals.actual / target) * 100)}%</strong>
          </div>
          <progress max={target} value={Math.min(totals.actual, target)} />
          <p>
            {totals.actual > target
              ? `חריגה של ${money(totals.actual - target)}`
              : `נשארו ${money(target - totals.actual)} לחוויות הבאות`}
          </p>
        </div>
      )}
      {!readOnly && (
        <form onSubmit={add} className="expense-form">
          <h3>מוסיפים הוצאה</h3>
          <div className="editor-fields">
            <label className="field">
              <span>על מה הוצאתם?</span>
              <input
                required
                maxLength={200}
                placeholder="למשל: ארוחת ערב"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="field">
              <span>סכום בשקלים</span>
              <input
                aria-label="סכום הוצאה"
                required
                type="number"
                min="0"
                max="10000000"
                step=".01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="field">
              <span>קטגוריה</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {Object.entries(categories).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>שיוך לתחנה (לא חובה)</span>
              <select
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
              >
                <option value="">הוצאה כללית</option>
                {plan.days
                  .flatMap((d) => d.activities)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <Button type="submit">
            <Plus size={16} />
            הוספת הוצאה
          </Button>
        </form>
      )}
      <div className="expense-list">
        <h3>ההוצאות שלכם</h3>
        {plan.expenses.length === 0 ? (
          <div className="small-empty">
            <ArrowDownLeft />
            <p>עדיין אין הוצאות. התחלה טובה.</p>
          </div>
        ) : (
          plan.expenses.map((e) => (
            <div className="expense-row" key={e.id}>
              <span className="expense-icon">
                <Wallet size={18} />
              </span>
              <div>
                <strong>{e.label}</strong>
                <small>{categories[e.category]}</small>
              </div>
              <b>{money(e.amount)}</b>
              {!readOnly && (
                <button
                  aria-label={`מחיקת הוצאה ${e.label}`}
                  onClick={() =>
                    edit({
                      ...plan,
                      expenses: plan.expenses.filter((v) => v.id !== e.id),
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
