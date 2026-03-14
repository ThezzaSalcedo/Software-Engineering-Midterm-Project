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
    <div className="space-y-4 p-4 bg-white text-foreground rounded-2xl shadow-2xl border min-w-[320px]">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4 w-full",
          caption: "flex justify-between items-center w-full mb-6 relative px-0",
          caption_label: "text-lg font-black tracking-tight",
          nav: "flex items-center gap-1",
          nav_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted text-foreground transition-all z-10 rounded-full"
          ),
          nav_button_previous: "absolute left-0",
          nav_button_next: "absolute right-0",
          table: "w-full border-collapse",
          head_row: "flex w-full mb-3",
          head_cell: "text-muted-foreground w-[14.285%] font-bold text-[0.65rem] uppercase text-center",
          row: "flex w-full mt-1",
          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-[14.285%] flex justify-center items-center h-10",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-muted rounded-full transition-colors"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full font-bold",
          day_today: "bg-accent/10 text-accent font-black border border-accent/20",
          day_outside:
            "day-outside text-muted-foreground/20 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          day_disabled: "text-muted-foreground opacity-20",
          day_range_middle:
            "aria-selected:bg-accent/10 aria-selected:text-primary",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ className, ...props }) => (
            <ChevronLeft className={cn("h-5 w-5", className)} {...props} />
          ),
          IconRight: ({ className, ...props }) => (
            <ChevronRight className={cn("h-5 w-5", className)} {...props} />
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
      <div className="border-t pt-4">
        <button
          onClick={onTodayClick}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-full rounded-xl gap-2 font-bold text-xs uppercase tracking-wider h-10 border-muted-foreground/20"
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
