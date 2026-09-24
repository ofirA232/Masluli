import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeft,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "./ui/button";
import { TravelersEditor } from "./TravelersEditor";
import {
  budgetTotals,
  categories,
  dayDate,
  formatDate,
  money,
  round2,
  uid,
} from "@/lib/trips";
import {
  CURRENCIES,
  balances,
  currencyLabels,
  participants as expenseParticipants,
  pruneTravelerRefs,
  settleUp,
  suggestedExpenseDate,
  toIls,
  totalsByCategory,
  totalsByDay,
  totalsByTraveler,
} from "@/lib/budget";
import { ilsRate } from "@/lib/fx";
import type { Category, Expense, TripPlan } from "@/types/itinerary";
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
    target = plan.metadata.targetBudget,
    travelers = plan.metadata.travelersList;
  const nameOf = (id: string | null) =>
    travelers.find((t) => t.id === id)?.name || "לא צוין";
  const [label, setLabel] = useState(""),
    [amount, setAmount] = useState(""),
    [currency, setCurrency] = useState("ILS"),
    [rate, setRate] = useState("1"),
    [rateHint, setRateHint] = useState(""),
    [category, setCategory] = useState<Category>("restaurant"),
    [activityId, setActivityId] = useState(""),
    [date, setDate] = useState(""),
    [paidBy, setPaidBy] = useState(""),
    [who, setWho] = useState<string[]>(() => travelers.map((t) => t.id)),
    [custom, setCustom] = useState(false),
    [shares, setShares] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  // The rate is only a default; the traveler can always type their own.
  useEffect(() => {
    let active = true;
    if (currency === "ILS") {
      setRate("1");
      setRateHint("");
      return;
    }
    setRateHint("מחפשים שער…");
    ilsRate(currency)
      .then((r) => {
        if (!active) return;
        setRate(String(r.rate));
        setRateHint(`שער ECB מ־${formatDate(r.date)}`);
      })
      .catch((e) => {
        if (active) setRateHint(e instanceof Error ? e.message : "");
      });
    return () => {
      active = false;
    };
  }, [currency]);
  const numericAmount = Number(amount),
    numericRate = Number(rate);
  const previewIls =
    amount !== "" && Number.isFinite(numericAmount) && numericRate > 0
      ? toIls(numericAmount, numericRate)
      : null;
  const customSum = round2(
    who.reduce((n, id) => n + (Number(shares[id]) || 0), 0),
  );
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !label.trim() ||
      amount === "" ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    )
      return;
    if (!(numericRate > 0)) {
      setError("נא להזין שער חליפין");
      return;
    }
    if (!who.length) {
      setError("בחרו לפחות מטייל אחד לחלוקה");
      return;
    }
    if (custom && Math.abs(customSum - numericAmount) > 0.01) {
      setError(
        `החלוקה מסתכמת ב־${customSum} במקום ${numericAmount}. נותר לחלק: ${round2(numericAmount - customSum)}`,
      );
      return;
    }
    const expense: Expense = {
      id: uid(),
      label: label.trim(),
      amount: numericAmount,
      currency,
      rate: currency === "ILS" ? 1 : numericRate,
      amountIls: toIls(numericAmount, currency === "ILS" ? 1 : numericRate),
      category,
      activityId: activityId || undefined,
      date: date || suggestedExpenseDate(plan, activityId, dayDate),
      paidBy: paidBy || null,
      split: custom
        ? {
            type: "custom",
            shares: Object.fromEntries(
              who.map((id) => [id, Number(shares[id]) || 0]),
            ),
          }
        : {
            type: "equal",
            shares:
              who.length === travelers.length
                ? {}
                : Object.fromEntries(who.map((id) => [id, 1])),
          },
    };
    edit({ ...plan, expenses: [...plan.expenses, expense] });
    setLabel("");
    setAmount("");
    setShares({});
    setCustom(false);
  };
  const rows = totalsByTraveler(plan),
    transfers = settleUp(balances(plan)),
    byCategory = totalsByCategory(plan),
    byDay = totalsByDay(plan);
  const unpaid = plan.expenses.filter((e) => !e.paidBy).length;
  return (
    <section className="budget-panel">
      <div className="panel-title">
        <span className="feature-icon">
          <Wallet />
        </span>
        <div>
          <h2>מקום גם לתקציב</h2>
          <p>תמונה ברורה של מה שמתוכנן, מה שכבר הוצאתם ומי חייב למי.</p>
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
          <small>כל ההוצאות מומרות לשקלים לפי השער ביום הרישום</small>
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
              <span>סכום</span>
              <input
                aria-label="סכום הוצאה"
                required
                type="number"
                inputMode="decimal"
                min="0"
                max="10000000"
                step=".01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="field">
              <span>מטבע</span>
              <select
                aria-label="מטבע"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {currencyLabels[c]}
                  </option>
                ))}
              </select>
            </label>
            {currency !== "ILS" && (
              <label className="field">
                <span>שער לשקל</span>
                <input
                  aria-label="שער לשקל"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <small className="fx-hint">
                  {previewIls !== null ? `≈ ${money(previewIls)} · ` : ""}
                  {rateHint}
                </small>
              </label>
            )}
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
            <label className="field">
              <span>תאריך</span>
              <input
                type="date"
                aria-label="תאריך ההוצאה"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span>מי שילם/ה</span>
              <select
                aria-label="מי שילם"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                <option value="">לא צוין</option>
                {travelers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {travelers.length > 1 && (
            <div className="split-block">
              <span className="split-label">מתחלק בין</span>
              <div className="split-chips" role="group" aria-label="חלוקה בין">
                {travelers.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    aria-pressed={who.includes(t.id)}
                    className={who.includes(t.id) ? "active" : ""}
                    onClick={() =>
                      setWho(
                        who.includes(t.id)
                          ? who.filter((id) => id !== t.id)
                          : [...who, t.id],
                      )
                    }
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={custom}
                  onChange={(e) => setCustom(e.target.checked)}
                />
                <span>חלוקה מותאמת (סכומים שונים)</span>
              </label>
              {custom && (
                <div className="custom-shares">
                  {travelers
                    .filter((t) => who.includes(t.id))
                    .map((t) => (
                      <label className="field" key={t.id}>
                        <span>{t.name}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step=".01"
                          aria-label={`חלק של ${t.name}`}
                          value={shares[t.id] || ""}
                          onChange={(e) =>
                            setShares({ ...shares, [t.id]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  <small>
                    נותר לחלק:{" "}
                    {amount === "" ? "—" : round2(numericAmount - customSum)}{" "}
                    {currency}
                  </small>
                </div>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
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
                <small>
                  {categories[e.category]}
                  {e.date ? ` · ${formatDate(e.date)}` : ""}
                  {e.paidBy ? ` · שילם/ה ${nameOf(e.paidBy)}` : ""}
                  {travelers.length > 1
                    ? ` · ${expenseParticipants(e, travelers).length} מתחלקים`
                    : ""}
                </small>
              </div>
              <b>
                {money(e.amountIls)}
                {e.currency !== "ILS" && (
                  <small dir="ltr">
                    {e.amount} {e.currency}
                  </small>
                )}
              </b>
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
      {!readOnly && (
        <div className="budget-section">
          <h3>
            <Users size={15} />
            מי נוסע
          </h3>
          <TravelersEditor
            value={travelers}
            inUse={
              new Set(
                plan.expenses.flatMap((e) => [
                  ...(e.paidBy ? [e.paidBy] : []),
                  ...Object.keys(e.split.shares),
                ]),
              )
            }
            onChange={(travelersList) =>
              edit({
                ...plan,
                metadata: {
                  ...plan.metadata,
                  travelersList,
                  travelers: travelersList.length,
                },
                expenses: pruneTravelerRefs(plan.expenses, travelersList),
              })
            }
          />
        </div>
      )}
      {plan.expenses.length > 0 && travelers.length > 1 && (
        <div className="budget-section">
          <h3>סיכום לפי מטייל</h3>
          <table className="budget-table">
            <thead>
              <tr>
                <th>מטייל</th>
                <th>שילם/ה</th>
                <th>החלק</th>
                <th>מאזן</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{money(r.paid)}</td>
                  <td>{money(r.share)}</td>
                  <td
                    className={
                      r.balance > 0
                        ? "is-positive"
                        : r.balance < 0
                          ? "is-negative"
                          : ""
                    }
                  >
                    {money(r.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>התחשבנות</h3>
          {transfers.length === 0 ? (
            <p className="muted">הכול מאוזן.</p>
          ) : (
            <ul className="settle-list">
              {transfers.map((t, i) => (
                <li key={i}>
                  <span>{nameOf(t.from)}</span>
                  <ArrowLeft size={13} />
                  <span>{nameOf(t.to)}</span>
                  <b>{money(t.amount)}</b>
                </li>
              ))}
            </ul>
          )}
          {unpaid > 0 && (
            <p className="muted">
              {unpaid} הוצאות בלי משלם/ת אינן נכללות בהתחשבנות.
            </p>
          )}
        </div>
      )}
      {plan.expenses.length > 0 && (
        <div className="budget-section budget-breakdown">
          <div>
            <h3>לפי קטגוריה</h3>
            <ul>
              {byCategory.map((c) => (
                <li key={c.category}>
                  <span>{categories[c.category]}</span>
                  <b>{money(c.total)}</b>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>לפי יום</h3>
            <ul>
              {byDay.map((d) => (
                <li key={d.date || "none"}>
                  <span>{d.date ? formatDate(d.date) : "ללא תאריך"}</span>
                  <b>{money(d.total)}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
