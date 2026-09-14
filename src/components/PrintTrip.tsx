import type { Activity, TripPlan } from "@/types/itinerary";
import {
  budgetTotals,
  dayDate,
  formatDate,
  lodgingKinds,
  lodgingNights,
  money,
  staysForDay,
  transportModes,
} from "@/lib/trips";

// Prints only saved planning data; transient provider data is never exported.
export function PrintTrip({ plan }: { plan: TripPlan }) {
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
                {transportModes[a.transport.mode]}
                {a.transport.from || a.transport.to
                  ? `: ${a.transport.from} ← ${a.transport.to}`
                  : ""}
                {a.transport.carrier ? ` · ${a.transport.carrier}` : ""}
                {a.transport.booking_ref
                  ? ` · הזמנה ${a.transport.booking_ref}`
                  : ""}
              </p>
            )}
            {a.lodging && (
              <p>
                {lodgingKinds[a.lodging.kind]} · צ'ק-אין{" "}
                {formatDate(a.lodging.check_in)} · צ'ק-אאוט{" "}
                {formatDate(a.lodging.check_out)} · {lodgingNights(a.lodging)}{" "}
                לילות
                {a.lodging.booking_ref
                  ? ` · הזמנה ${a.lodging.booking_ref}`
                  : ""}
              </p>
            )}
            {a.description && <p>{a.description}</p>}
            {a.address && <p>{a.address}</p>}
            {a.notes && <p className="print-notes">{a.notes}</p>}
            <small>
              {a.estimate
                ? `${money(a.estimate.min)}–${money(a.estimate.max)} · ${a.estimate.basis === "person" ? "לאדם" : "לקבוצה"} · כמות ${a.estimate.quantity}${a.estimate.source === "ai" ? " · אומדן AI" : ""}`
                : "עלות לא ידועה"}
            </small>
          </li>
        ))}
      </ol>
    ) : (
      <p>יום פתוח לחוויות חדשות.</p>
    );
  return (
    <section className="print-trip" aria-label="מסלול מלא להדפסה">
      <header>
        <strong>Planatrip</strong>
        <h1>{plan.metadata.title}</h1>
        <p>
          {plan.metadata.destination} · {plan.days.length} ימים ·{" "}
          {plan.metadata.travelers} מטיילים
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
            יום {d.day_number}
            {dayDate(plan.metadata.startDate, d.day_number - 1) &&
              ` · ${formatDate(dayDate(plan.metadata.startDate, d.day_number - 1))}`}
          </h2>
          {staysForDay(plan, d.day_number).map((s) => (
            <p key={s.activity.id} className="print-stay">
              לינה: {s.activity.name} ·{" "}
              {s.checkout ? "צ'ק-אאוט" : `לילה ${s.night} מתוך ${s.nights}`}
            </p>
          ))}
          {activities(d.activities)}
        </section>
      ))}
      {!!plan.saved_places.length && (
        <section>
          <h2>מקומות שטרם שובצו</h2>
          {activities(plan.saved_places)}
        </section>
      )}
      <section className="print-budget">
        <h2>תקציב והוצאות · ₪</h2>
        <p>
          תקציב שהוגדר:{" "}
          {plan.metadata.targetBudget === null
            ? "לא הוגדר"
            : money(plan.metadata.targetBudget)}
        </p>
        <p>
          אומדן לתחנות המשובצות עם עלות ידועה:{" "}
          {plan.days.some((d) => d.activities.some((a) => a.estimate))
            ? `${money(totals.min)}–${money(totals.max)}`
            : "עדיין לא ידוע"}
        </p>
        <p>
          {totals.unknown} תחנות ללא אומדן · הוצאות בפועל:{" "}
          {money(totals.actual)}
        </p>
        <p>האומדן וההוצאות מוצגים בנפרד. אומדנים אינם הצעת מחיר.</p>
        {!!plan.expenses.length && (
          <ul>
            {plan.expenses.map((e) => (
              <li key={e.id}>
                {e.label}: {money(e.amount)}
              </li>
            ))}
          </ul>
        )}
      </section>
      {plan.notes && (
        <section>
          <h2>הערות לדרך</h2>
          <p className="print-notes">{plan.notes}</p>
        </section>
      )}
    </section>
  );
}
