import * as React from "react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card } from "@/components/ui/card";

interface DateFilterProps {
  onDateChange?: (date: Date | undefined) => void;
}

export function DateFilter({ onDateChange }: DateFilterProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const handleDateChange = (newDate: Date | undefined) => {
    console.log("Selected date:", newDate);
    setDate(newDate);
    onDateChange?.(newDate);
  };

  return (
    <Card className="p-6 bg-metric-bg border-metric-border hover:shadow-lg transition-shadow duration-200">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Ish Kuni</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"ghost"}
              className={cn(
                "text-3xl font-bold h-auto p-0 hover:bg-transparent",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "dd.MM.yyyy") : "Sana tanlang"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {/* <p className="text-xs text-muted-foreground">{format(new Date(), "dd.MM.yyyy")}</p> */}
      </div>
    </Card>
  );
}
