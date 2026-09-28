import { lazy, Suspense, useEffect, useState } from "react";
import { format, parseISO, type Locale } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";
// The calendar is a third of this page weight; load it when the panel opens.
const Calendar = lazy(() =>
  import("@/components/ui/calendar").then((m) => ({ default: m.Calendar })),
);
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLang, useT } from "@/i18n";
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const pretty = (value: string, pattern: string, locale: Locale) =>
  value ? format(parseISO(value), pattern, { locale }) : "";
// One field for both dates: a range calendar, with the two native date
// inputs kept inside the panel for direct entry and for form validation.
export function TripDates({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (dates: { startDate: string; endDate: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const words = useT().trip.dates,
    { dir, locale } = useLang();
  const short = (value: string) => pretty(value, words.short, locale);
  // The panel always drops below the field, like any dropdown: flipping it
  // above would cover the page's headline. Where there is no room below, the
  // page scrolls just enough to bring the whole panel into view (again once
  // the lazy calendar has landed and the panel has grown).
  // A callback ref: the portal renders the panel a render after it opens.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = panel;
    if (!open || !el) return;
    const reveal = () => {
      const overflow = el.getBoundingClientRect().bottom + 12 - innerHeight;
      if (overflow <= 0) return;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollBy({ top: overflow, behavior: reduce ? "auto" : "smooth" });
    };
    // Radix places the panel a frame after it renders; measure after that.
    let frame = 0;
    const settle = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(reveal);
      });
    };
    const resized = new ResizeObserver(settle);
    resized.observe(el);
    return () => {
      resized.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [open, panel]);
  const selected: DateRange | undefined = startDate
    ? {
        from: parseISO(startDate),
        to: endDate ? parseISO(endDate) : undefined,
      }
    : undefined;
  const label =
    startDate && endDate
      ? `${short(startDate)} — ${short(endDate)}`
      : startDate
        ? `${short(startDate)} — ?`
        : "";
  return (
    <div className="field dates-field">
      <span>
        <CalendarDays size={16} />
        {words.when}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="dates-trigger" type="button">
          {label || <em>{words.choose}</em>}
        </PopoverTrigger>
        <PopoverContent
          ref={setPanel}
          className="dates-panel"
          side="bottom"
          align="start"
          // Keep it inside the screen sideways, but never flip it upward: an
          // unreachable bottom edge means it can always stay below.
          collisionPadding={{ top: 12, right: 12, left: 12, bottom: -100000 }}
        >
          <Suspense fallback={<div className="dates-loading" />}>
            <Calendar
              mode="range"
              numberOfMonths={2}
              locale={locale}
              dir={dir}
              defaultMonth={selected?.from}
              selected={selected}
              disabled={{ before: new Date() }}
              classNames={{
                months: "dates-months",
                caption_label: "text-base font-medium",
                cell: "h-11 w-11 p-0 text-center relative",
                day: "h-11 w-11 rounded-[14px] font-normal",
                head_cell: "w-11 text-xs text-muted-foreground font-normal",
                // In RTL the previous month sits to the right.
                nav_button_previous:
                  dir === "rtl" ? "absolute right-1" : "absolute left-1",
                nav_button_next:
                  dir === "rtl" ? "absolute left-1" : "absolute right-1",
              }}
              onSelect={(range) =>
                onChange({
                  startDate: range?.from ? iso(range.from) : "",
                  endDate: range?.to ? iso(range.to) : "",
                })
              }
            />
          </Suspense>
          <div className="dates-inputs">
            <label>
              {words.leaving}
              <input
                name="startDate"
                aria-label={words.start}
                type="date"
                value={startDate}
                onChange={(e) =>
                  onChange({ startDate: e.target.value, endDate })
                }
                required
              />
            </label>
            <label>
              {words.returning}
              <input
                name="endDate"
                aria-label={words.end}
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) =>
                  onChange({ startDate, endDate: e.target.value })
                }
                required
              />
            </label>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
