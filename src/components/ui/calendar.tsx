"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onTodayClick?: () => void
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onTodayClick,
  ...props
}: CalendarProps) {
  return (
    <div className="space-y-4 p-4 bg-white text-foreground rounded-2xl shadow-sm border">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-between pt-1 relative items-center w-full px-2 mb-4",
          caption_label: "text-lg font-bold tracking-tight",
          nav: "flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted text-foreground transition-all"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex w-full mb-2",
          head_cell: "text-muted-foreground flex-1 font-bold text-[0.75rem] uppercase text-center",
          row: "flex w-full mt-2",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 flex justify-center items-center h-9",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-full transition-colors"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full font-bold",
          day_today: "bg-accent/20 text-accent font-bold",
          day_outside:
            "day-outside text-muted-foreground/30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ className, ...props }) => (
            <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          ),
          IconRight: ({ className, ...props }) => (
            <ChevronRight className={cn("h-4 w-4", className)} {...props} />
          ),
        }}
        formatters={{
          formatWeekdayName: (date) => {
            const days = ["S", "M", "T", "W", "TH", "F", "S"];
            return days[date.getDay()];
          },
        }}
        {...props}
      />
      <div className="border-t pt-4 flex items-center justify-center">
        <button
          onClick={onTodayClick}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full rounded-xl gap-2 font-bold text-xs uppercase tracking-wider"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Go to Today
        </button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
