import { useState } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { Calendar as CalendarIcon, Filter, RotateCcw, X, ChevronDown } from "lucide-react";
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
  const [lastClickedDate, setLastClickedDate] = useState<Date | null>(null);
  const [tempSelectedClosers, setTempSelectedClosers] = useState<string[]>([]);
  const [tempSelectedSetters, setTempSelectedSetters] = useState<string[]>([]);

  const handleDateRangeChange = (newRange: { start: Date; end: Date }) => {
    setDateRange(newRange);
    onFiltersChange({
      dateRange: newRange,
      selectedClosers,
      selectedSetters
    });
  };

  const handleCloserToggle = (closer: string) => {
    const newTempClosers = tempSelectedClosers.includes(closer)
      ? tempSelectedClosers.filter(c => c !== closer)
      : [...tempSelectedClosers, closer];
    setTempSelectedClosers(newTempClosers);
  };

  const handleSetterToggle = (setter: string) => {
    const newTempSetters = tempSelectedSetters.includes(setter)
      ? tempSelectedSetters.filter(s => s !== setter)
      : [...tempSelectedSetters, setter];
    setTempSelectedSetters(newTempSetters);
  };

  const applyCloserFilters = () => {
    setSelectedClosers(tempSelectedClosers);
    onFiltersChange({
      dateRange,
      selectedClosers: tempSelectedClosers,
      selectedSetters
    });
  };

  const applySetterFilters = () => {
    setSelectedSetters(tempSelectedSetters);
    onFiltersChange({
      dateRange,
      selectedClosers,
      selectedSetters: tempSelectedSetters
    });
  };

  const clearDateRange = () => {
    const defaultRange = {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 })
    };
    
    setDateRange(defaultRange);
    setLastClickedDate(null);
    onFiltersChange({
      dateRange: defaultRange,
      selectedClosers,
      selectedSetters
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
    setTempSelectedClosers([]);
    setTempSelectedSetters([]);
    setLastClickedDate(null);
    
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
              <div className="p-3 border-b flex items-center justify-between">
                <span className="text-sm font-medium">Select Date Range</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <Calendar
                mode="range"
                defaultMonth={dateRange.start}
                selected={{
                  from: dateRange.start,
                  to: dateRange.end
                } as DateRange}
                onSelect={(range: DateRange | undefined) => {
                  if (range?.from) {
                    if (lastClickedDate && lastClickedDate.getTime() === range.from.getTime()) {
                      // Double click - set both start and end to the same date
                      handleDateRangeChange({ start: range.from, end: range.from });
                      setLastClickedDate(null);
                    } else {
                      // Single click - always set as start date
                      setLastClickedDate(range.from);
                      if (range.to) {
                        handleDateRangeChange({ start: range.from, end: range.to });
                      } else {
                        handleDateRangeChange({ start: range.from, end: range.from });
                      }
                    }
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
          <Popover onOpenChange={(open) => {
            if (open) {
              setTempSelectedClosers(selectedClosers);
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline" 
                className="w-[180px] justify-between font-normal"
              >
                <span className="truncate">
                  {selectedClosers.length > 0 
                    ? selectedClosers.join(", ")
                    : "All Closers"
                  }
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="max-h-[200px] overflow-y-auto">
                {closers.map((closer) => (
                  <div
                    key={closer}
                    className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleCloserToggle(closer)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={cn(
                        "h-3 w-3 border rounded-sm",
                        tempSelectedClosers.includes(closer) 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground"
                      )}>
                        {tempSelectedClosers.includes(closer) && (
                          <div className="h-full w-full bg-primary-foreground rounded-sm scale-50" />
                        )}
                      </div>
                      {closer}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-2">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={applyCloserFilters}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Setter Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Setter:</span>
          <Popover onOpenChange={(open) => {
            if (open) {
              setTempSelectedSetters(selectedSetters);
            }
          }}>
            <PopoverTrigger asChild>
              <Button
                variant="outline" 
                className="w-[180px] justify-between font-normal"
              >
                <span className="truncate">
                  {selectedSetters.length > 0 
                    ? selectedSetters.join(", ")
                    : "All Setters"
                  }
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <div className="max-h-[200px] overflow-y-auto">
                {setters.map((setter) => (
                  <div
                    key={setter}
                    className="relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSetterToggle(setter)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={cn(
                        "h-3 w-3 border rounded-sm",
                        tempSelectedSetters.includes(setter) 
                          ? "bg-primary border-primary" 
                          : "border-muted-foreground"
                      )}>
                        {tempSelectedSetters.includes(setter) && (
                          <div className="h-full w-full bg-primary-foreground rounded-sm scale-50" />
                        )}
                      </div>
                      {setter}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-2">
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={applySetterFilters}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
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