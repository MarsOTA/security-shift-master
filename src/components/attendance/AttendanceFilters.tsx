import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface AttendanceFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onQuickFilter: (days: number) => void;
}

export const AttendanceFilters = ({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  onQuickFilter
}: AttendanceFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onQuickFilter(7)}>
          Ultima settimana
        </Button>
        <Button variant="outline" size="sm" onClick={() => onQuickFilter(30)}>
          Ultimo mese
        </Button>
        <Button variant="outline" size="sm" onClick={() => onQuickFilter(90)}>
          Ultimi 3 mesi
        </Button>
      </div>

      <div className="flex gap-2 flex-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal flex-1">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd MMM yyyy', { locale: it })} -{' '}
                    {format(dateRange.to, 'dd MMM yyyy', { locale: it })}
                  </>
                ) : (
                  format(dateRange.from, 'dd MMM yyyy', { locale: it })
                )
              ) : (
                <span>Seleziona periodo</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={it}
            />
          </PopoverContent>
        </Popover>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="completed">Completati</SelectItem>
            <SelectItem value="in_progress">In corso</SelectItem>
            <SelectItem value="missed">Mancati</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
