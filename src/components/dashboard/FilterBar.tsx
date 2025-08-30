import { useState } from "react";
import { CalendarIcon, Filter, RotateCcw } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  closers: string[];
  setters: string[];
  onFiltersChange: (filters: {
    dateRange: { start: Date; end: Date };
    selectedClosers: string[];
    selectedSetters: string[];
  }) => void;
}

export function FilterBar({ closers, setters, onFiltersChange }: FilterBarProps) {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 })
  });
  const [selectedClosers, setSelectedClosers] = useState<string[]>([]);
  const [selectedSetters, setSelectedSetters] = useState<string[]>([]);

  const handleDateRangeChange = (newRange: { start: Date; end: Date }) => {
    setDateRange(newRange);
    onFiltersChange({
      dateRange: newRange,
      selectedClosers,
      selectedSetters
    });
  };

  const handleCloserChange = (closer: string) => {
    const newClosers = selectedClosers.includes(closer)
      ? selectedClosers.filter(c => c !== closer)
      : [...selectedClosers, closer];
    
    setSelectedClosers(newClosers);
    onFiltersChange({
      dateRange,
      selectedClosers: newClosers,
      selectedSetters
    });
  };

  const handleSetterChange = (setter: string) => {
    const newSetters = selectedSetters.includes(setter)
      ? selectedSetters.filter(s => s !== setter)
      : [...selectedSetters, setter];
    
    setSelectedSetters(newSetters);
    onFiltersChange({
      dateRange,
      selectedClosers,
      selectedSetters: newSetters
    });
  };

  const resetFilters = () => {
    const defaultRange = {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 })
    };
    
    setDateRange(defaultRange);
    setSelectedClosers([]);
    setSelectedSetters([]);
    
    onFiltersChange({
      dateRange: defaultRange,
      selectedClosers: [],
      selectedSetters: []
    });
  };

  return (
    <Card className="p-4 mb-6 bg-dashboard-surface border-border">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>

        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Date Range:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  "hover:bg-dashboard-surface-hover"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.start, "MMM dd")} - {format(dateRange.end, "MMM dd, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange.start}
                selected={{
                  from: dateRange.start,
                  to: dateRange.end
                } as DateRange}
                onSelect={(range: DateRange | undefined) => {
                  if (range?.from && range?.to) {
                    handleDateRangeChange({ start: range.from, end: range.to });
                  }
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Closer Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Closer:</span>
          <Select onValueChange={handleCloserChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={
                selectedClosers.length > 0 
                  ? `${selectedClosers.length} selected`
                  : "All Closers"
              } />
            </SelectTrigger>
            <SelectContent>
              {closers.map((closer) => (
                <SelectItem key={closer} value={closer}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedClosers.includes(closer)}
                      readOnly
                      className="h-3 w-3"
                    />
                    {closer}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Setter Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Setter:</span>
          <Select onValueChange={handleSetterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={
                selectedSetters.length > 0 
                  ? `${selectedSetters.length} selected`
                  : "All Setters"
              } />
            </SelectTrigger>
            <SelectContent>
              {setters.map((setter) => (
                <SelectItem key={setter} value={setter}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedSetters.includes(setter)}
                      readOnly
                      className="h-3 w-3"
                    />
                    {setter}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="ml-auto"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
    </Card>
  );
}