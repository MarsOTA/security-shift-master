import { useState } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface DateFilter {
  startDate: Date | null;
  endDate: Date | null;
}

interface EventsDateFilterProps {
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
}

export default function EventsDateFilter({
  dateFilter,
  onDateFilterChange,
}: EventsDateFilterProps) {
  const handleReset = () => {
    onDateFilterChange({ startDate: null, endDate: null });
  };

  const handlePreset = (preset: "week" | "month" | "30days") => {
    const today = new Date();

    switch (preset) {
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Lunedì
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Domenica
        onDateFilterChange({ startDate: weekStart, endDate: weekEnd });
        break;
      }
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        onDateFilterChange({ startDate: monthStart, endDate: monthEnd });
        break;
      }
      case "30days": {
        const thirtyDaysEnd = new Date(today);
        thirtyDaysEnd.setDate(today.getDate() + 30);
        onDateFilterChange({ startDate: today, endDate: thirtyDaysEnd });
        break;
      }
    }
  };

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarIcon className="h-4 w-4" />
            <span>Filtra per data</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            {/* Data inizio */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFilter.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter.startDate
                    ? format(dateFilter.startDate, "dd/MM/yyyy", { locale: it })
                    : "Dal..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter.startDate || undefined}
                  onSelect={(date) =>
                    onDateFilterChange({
                      ...dateFilter,
                      startDate: date || null,
                    })
                  }
                  initialFocus
                  locale={it}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Data fine */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFilter.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter.endDate
                    ? format(dateFilter.endDate, "dd/MM/yyyy", { locale: it })
                    : "Al..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFilter.endDate || undefined}
                  onSelect={(date) =>
                    onDateFilterChange({
                      ...dateFilter,
                      endDate: date || null,
                    })
                  }
                  initialFocus
                  locale={it}
                  disabled={(date) =>
                    dateFilter.startDate
                      ? date < dateFilter.startDate
                      : false
                  }
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Reset button */}
            {(dateFilter.startDate || dateFilter.endDate) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preset rapidi */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePreset("week")}
          >
            Questa settimana
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePreset("month")}
          >
            Questo mese
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handlePreset("30days")}
          >
            Prossimi 30 giorni
          </Button>
        </div>
      </div>
    </Card>
  );
}
