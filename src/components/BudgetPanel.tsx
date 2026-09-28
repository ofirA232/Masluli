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
import { useLang, useT } from "@/i18n";
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
  const words = useT(),
    t = words.budget,
    { lang } = useLang();
  const totals = budgetTotals(plan),
    target = plan.metadata.targetBudget,
    travelers = plan.metadata.travelersList;
  const nameOf = (id: string | null) =>
    travelers.find((v) => v.id === id)?.name || t.notSpecified;
  const [label, setLabel] = useState(""),
    [amount, setAmount] = useState(""),
    [currency, setCurrency] = useState("ILS"),
    [rate, setRate] = useState("1"),
    // Kept as data, not text, so it follows a language change.
    [rateHint, setRateHint] = useState<{
      loading?: boolean;
      date?: string;
      error?: string;
    } | null>(null),
    [category, setCategory] = useState<Category>("restaurant"),
    [activityId, setActivityId] = useState(""),
    [date, setDate] = useState(""),
    [paidBy, setPaidBy] = useState(""),
    [who, setWho] = useState<string[]>(() => travelers.map((v) => v.id)),
    [custom, setCustom] = useState(false),
    [shares, setShares] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  // The rate is only a default; the traveler can always type their own.
  useEffect(() => {
    let active = true;
    if (currency === "ILS") {
      setRate("1");
      setRateHint(null);
      return;
    }
    setRateHint({ loading: true });
    ilsRate(currency)
      .then((r) => {
        if (!active) return;
        setRate(String(r.rate));
        setRateHint({ date: r.date });
      })
      .catch((e) => {
        if (active) setRateHint({ error: e instanceof Error ? e.message : "" });
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
      setError(t.errors.rate);
      return;
    }
    if (!who.length) {
      setError(t.errors.noTraveler);
      return;
    }
    if (custom && Math.abs(customSum - numericAmount) > 0.01) {
      setError(
        t.errors.splitMismatch(
          customSum,
          numericAmount,
          round2(numericAmount - customSum),
        ),
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
          <h2>{t.title}</h2>
          <p>{t.intro}</p>
        </div>
      </div>
      <div className="budget-stats">
        <div>
          <span>{t.yourBudget}</span>
          <strong>{target === null ? t.notSetYet : money(target)}</strong>
        </div>
        <div>
          <span>{t.planned}</span>
          <strong>
            {!plan.days.some((d) => d.activities.some((a) => a.estimate))
              ? t.unknownYet
              : totals.min === totals.max
                ? money(totals.min)
                : `${money(totals.min)}–${money(totals.max)}`}
          </strong>
          <small>
            {totals.unknown > 0 ? t.missingCost(totals.unknown) : t.allStops}
          </small>
        </div>
        <div>
          <span>{t.actual}</span>
          <strong>{money(totals.actual)}</strong>
          <small>{t.actualNote}</small>
        </div>
      </div>
      {target !== null && target > 0 && (
        <div className="budget-progress">
          <div>
            <span>{t.ofBudget}</span>
            <strong>{Math.round((totals.actual / target) * 100)}%</strong>
          </div>
          <progress max={target} value={Math.min(totals.actual, target)} />
          <p>
            {totals.actual > target
              ? t.over(money(totals.actual - target))
              : t.left(money(target - totals.actual))}
          </p>
        </div>
      )}
      {!readOnly && (
        <form onSubmit={add} className="expense-form">
          <h3>{t.addTitle}</h3>
          <div className="editor-fields">
            <label className="field">
              <span>{t.whatFor}</span>
              <input
                required
                maxLength={200}
                placeholder={t.labelPlaceholder}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="field">
              <span>{t.amount}</span>
              <input
                aria-label={t.amountAria}
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
              <span>{t.currency}</span>
              <select
                aria-label={t.currency}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {currencyLabels(lang)[c]}
                  </option>
                ))}
              </select>
            </label>
            {currency !== "ILS" && (
              <label className="field">
                <span>{t.rate}</span>
                <input
                  aria-label={t.rate}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <small className="fx-hint">
                  {previewIls !== null ? `≈ ${money(previewIls)} · ` : ""}
                  {rateHint?.loading
                    ? t.findingRate
                    : rateHint?.date
                      ? t.ecbRate(formatDate(rateHint.date))
                      : rateHint?.error}
                </small>
              </label>
            )}
            <label className="field">
              <span>{t.category}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {(Object.keys(categories) as Category[]).map((value) => (
                  <option key={value} value={value}>
                    {words.common.categories[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t.linkStop}</span>
              <select
                value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
              >
                <option value="">{t.general}</option>
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
              <span>{t.date}</span>
              <input
                type="date"
                aria-label={t.dateAria}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="field">
              <span>{t.whoPaid}</span>
              <select
                aria-label={t.whoPaidAria}
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                <option value="">{t.notSpecified}</option>
                {travelers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {travelers.length > 1 && (
            <div className="split-block">
              <span className="split-label">{t.splitBetween}</span>
              <div
                className="split-chips"
                role="group"
                aria-label={t.splitAria}
              >
                {travelers.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    aria-pressed={who.includes(v.id)}
                    className={who.includes(v.id) ? "active" : ""}
                    onClick={() =>
                      setWho(
                        who.includes(v.id)
                          ? who.filter((id) => id !== v.id)
                          : [...who, v.id],
                      )
                    }
                  >
                    {v.name}
                  </button>
                ))}
              </div>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={custom}
                  onChange={(e) => setCustom(e.target.checked)}
                />
                <span>{t.customSplit}</span>
              </label>
              {custom && (
                <div className="custom-shares">
                  {travelers
                    .filter((v) => who.includes(v.id))
                    .map((v) => (
                      <label className="field" key={v.id}>
                        <span>{v.name}</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step=".01"
                          aria-label={t.shareOf(v.name)}
                          value={shares[v.id] || ""}
                          onChange={(e) =>
                            setShares({ ...shares, [v.id]: e.target.value })
                          }
                        />
                      </label>
                    ))}
                  <small>
                    {t.leftToSplit}{" "}
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
            {t.addExpense}
          </Button>
        </form>
      )}
      <div className="expense-list">
        <h3>{t.yourExpenses}</h3>
        {plan.expenses.length === 0 ? (
          <div className="small-empty">
            <ArrowDownLeft />
            <p>{t.noExpenses}</p>
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
                  {words.common.categories[e.category]}
                  {e.date ? ` · ${formatDate(e.date)}` : ""}
                  {e.paidBy ? ` · ${t.paidBy(nameOf(e.paidBy))}` : ""}
                  {travelers.length > 1
                    ? ` · ${t.sharing(expenseParticipants(e, travelers).length)}`
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
                  aria-label={t.deleteExpense(e.label)}
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
            {t.whoTravels}
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
          <h3>{t.byTraveler}</h3>
          <table className="budget-table">
            <thead>
              <tr>
                <th>{t.columns.traveler}</th>
                <th>{t.columns.paid}</th>
                <th>{t.columns.share}</th>
                <th>{t.columns.balance}</th>
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
          <h3>{t.settleUp}</h3>
          {transfers.length === 0 ? (
            <p className="muted">{t.allSquare}</p>
          ) : (
            <ul className="settle-list">
              {transfers.map((x, i) => (
                <li key={i}>
                  <span>{nameOf(x.from)}</span>
                  {/* Points "forward"; the stylesheet turns it for English. */}
                  <ArrowLeft size={13} />
                  <span>{nameOf(x.to)}</span>
                  <b>{money(x.amount)}</b>
                </li>
              ))}
            </ul>
          )}
          {unpaid > 0 && <p className="muted">{t.unpaidNote(unpaid)}</p>}
        </div>
      )}
      {plan.expenses.length > 0 && (
        <div className="budget-section budget-breakdown">
          <div>
            <h3>{t.byCategory}</h3>
            <ul>
              {byCategory.map((c) => (
                <li key={c.category}>
                  <span>{words.common.categories[c.category]}</span>
                  <b>{money(c.total)}</b>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>{t.byDay}</h3>
            <ul>
              {byDay.map((d) => (
                <li key={d.date || "none"}>
                  <span>{d.date ? formatDate(d.date) : t.noDate}</span>
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
