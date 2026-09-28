import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { useLang, useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  setDate,
  className,
}: DatePickerWithRangeProps) {
  const words = useT().trip.dates,
    { dir, locale } = useLang();
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-start font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="ms-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale })} - {format(date.to, "dd/MM/yyyy", { locale })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale })
              )
            ) : (
              <span>{words.pick}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={locale}
            dir={dir}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
