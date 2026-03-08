"use client";

import * as React from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

interface DatePickerWithRangeProps {
  className?: string;
  date: {
    from: Date;
    to: Date | undefined;
  };
  setDate: React.Dispatch<
    React.SetStateAction<{
      from: Date;
      to: Date | undefined;
    }>
  >;
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (selectedDate: DateRange | undefined) => {
      if (selectedDate && selectedDate.from) {
        setDate({
          from: selectedDate.from,
          to: selectedDate.to
        });
        if (selectedDate.to) {
          setIsOpen(false);
        }
      }
    },
    [setDate]
  );

  return (
    <div className={cn("grid gap-2", className)}>
      <Button
        id="date"
        type="button"
        variant={"outline"}
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} -{" "}
              {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={{
              from: date.from,
              to: date.to
            }}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
} 