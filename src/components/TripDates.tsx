import { lazy, Suspense, useState } from "react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
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
const iso = (d: Date) => format(d, "yyyy-MM-dd");
const pretty = (value: string) =>
  value ? format(parseISO(value), "d בMMM", { locale: he }) : "";
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
  const selected: DateRange | undefined = startDate
    ? {
        from: parseISO(startDate),
        to: endDate ? parseISO(endDate) : undefined,
      }
    : undefined;
  const label =
    startDate && endDate
      ? `${pretty(startDate)} — ${pretty(endDate)}`
      : startDate
        ? `${pretty(startDate)} — ?`
        : "";
  return (
    <div className="field dates-field">
      <span>
        <CalendarDays size={16} />
        מתי?
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="dates-trigger" type="button">
          {label || <em>בחרו תאריכים</em>}
        </PopoverTrigger>
        <PopoverContent className="dates-panel" align="start">
          <Suspense fallback={<div className="dates-loading" />}>
            <Calendar
              mode="range"
              numberOfMonths={2}
              locale={he}
              dir="rtl"
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
                nav_button_previous: "absolute right-1",
                nav_button_next: "absolute left-1",
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
              יוצאים
              <input
                name="startDate"
                aria-label="תאריך התחלה"
                type="date"
                value={startDate}
                onChange={(e) =>
                  onChange({ startDate: e.target.value, endDate })
                }
                required
              />
            </label>
            <label>
              חוזרים
              <input
                name="endDate"
                aria-label="תאריך סיום"
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
