import type { Activity, TripPlan } from "@/types/itinerary";
import { balances, settleUp } from "@/lib/budget";
import {
  budgetTotals,
  dayDate,
  formatDate,
  lodgingNights,
  money,
  staysForDay,
} from "@/lib/trips";
import { useT } from "@/i18n";

// Prints only saved planning data; transient provider data is never exported.
export function PrintTrip({ plan }: { plan: TripPlan }) {
  const words = useT(),
    t = words.print,
    common = words.common;
  const totals = budgetTotals(plan);
  const activities = (items: Activity[]) =>
    items.length ? (
      <ol>
        {items.map((a) => (
          <li key={a.id}>
            <h3>
              {a.time && <span>{a.time} · </span>}
              {a.name}
            </h3>
            {a.transport && (
              <p>
                {common.transportModes[a.transport.mode]}
                {a.transport.from || a.transport.to
                  ? `: ${t.route(a.transport.from, a.transport.to)}`
                  : ""}
                {a.transport.carrier ? ` · ${a.transport.carrier}` : ""}
                {a.transport.booking_ref
                  ? ` · ${t.booking(a.transport.booking_ref)}`
                  : ""}
              </p>
            )}
            {a.lodging && (
              <p>
                {common.lodgingKinds[a.lodging.kind]} · {common.checkIn}{" "}
                {formatDate(a.lodging.check_in)} · {common.checkOut}{" "}
                {formatDate(a.lodging.check_out)} ·{" "}
                {t.nights(lodgingNights(a.lodging))}
                {a.lodging.booking_ref
                  ? ` · ${t.booking(a.lodging.booking_ref)}`
                  : ""}
              </p>
            )}
            {a.description && <p>{a.description}</p>}
            {a.address && <p>{a.address}</p>}
            {a.notes && <p className="print-notes">{a.notes}</p>}
            <small>
              {a.estimate
                ? `${money(a.estimate.min)}–${money(a.estimate.max)} · ${a.estimate.basis === "person" ? t.perPerson : t.perGroup} · ${t.quantity(a.estimate.quantity)}${a.estimate.source === "ai" ? ` · ${t.aiEstimate}` : ""}`
                : t.unknownCost}
            </small>
          </li>
        ))}
      </ol>
    ) : (
      <p>{t.openDay}</p>
    );
  return (
    <section className="print-trip" aria-label={t.ariaLabel}>
      <header>
        <strong>Masluli</strong>
        <h1>{plan.metadata.title}</h1>
        <p>
          {plan.metadata.destination} · {t.days(plan.days.length)} ·{" "}
          {t.travelers(plan.metadata.travelers)}
        </p>
        {plan.metadata.startDate && (
          <p>
            {formatDate(plan.metadata.startDate)} –{" "}
            {formatDate(plan.metadata.endDate)}
          </p>
        )}
      </header>
      {plan.days.map((d) => (
        <section key={d.day_number} className="print-day">
          <h2>
            {t.day(d.day_number)}
            {dayDate(plan.metadata.startDate, d.day_number - 1) &&
              ` · ${formatDate(dayDate(plan.metadata.startDate, d.day_number - 1))}`}
          </h2>
          {staysForDay(plan, d.day_number).map((s) => (
            <p key={s.activity.id} className="print-stay">
              {t.stay(s.activity.name)} ·{" "}
              {s.checkout ? common.checkOut : common.nightOf(s.night, s.nights)}
            </p>
          ))}
          {activities(d.activities)}
        </section>
      ))}
      {!!plan.saved_places.length && (
        <section>
          <h2>{t.unscheduled}</h2>
          {activities(plan.saved_places)}
        </section>
      )}
      <section className="print-budget">
        <h2>{t.budgetTitle}</h2>
        <p>
          {t.budgetSet}{" "}
          {plan.metadata.targetBudget === null
            ? t.notSet
            : money(plan.metadata.targetBudget)}
        </p>
        <p>
          {t.estimate}{" "}
          {plan.days.some((d) => d.activities.some((a) => a.estimate))
            ? `${money(totals.min)}–${money(totals.max)}`
            : t.unknownYet}
        </p>
        <p>
          {t.noEstimate(totals.unknown)} · {t.actual} {money(totals.actual)}
        </p>
        <p>{t.disclaimer}</p>
        {!!plan.expenses.length && (
          <ul>
            {plan.expenses.map((e) => {
              const payer = plan.metadata.travelersList.find(
                (v) => v.id === e.paidBy,
              );
              return (
                <li key={e.id}>
                  {e.label}: {money(e.amountIls)}
                  {e.currency !== "ILS" ? ` (${e.amount} ${e.currency})` : ""}
                  {payer ? ` · ${words.budget.paidBy(payer.name)}` : ""}
                </li>
              );
            })}
          </ul>
        )}
        {settleUp(balances(plan)).length > 0 && (
          <>
            <h3>{words.budget.settleUp}</h3>
            <ul>
              {settleUp(balances(plan)).map((x, i) => {
                const name = (id: string) =>
                  plan.metadata.travelersList.find((v) => v.id === id)?.name ||
                  id;
                return (
                  <li key={i}>
                    {t.transfer(name(x.from), name(x.to), money(x.amount))}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
      {plan.notes && (
        <section>
          <h2>{t.notes}</h2>
          <p className="print-notes">{plan.notes}</p>
        </section>
      )}
    </section>
  );
}
