import { useState, useCallback, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, startOfYear, subDays } from "date-fns";
import { Calendar as CalendarIcon, Filter, RotateCcw, X, Loader2, Building2, Users, UserCheck, Clock } from "lucide-react";
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
import { useCompanies, Company } from "@/hooks/useCompanies";
import { Profile } from "@/lib/supabase";

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface FilterBarProps {
  closers: string[];
  setters: string[];
  onFiltersChange: (filters: {
    dateRange: { start: Date; end: Date };
    selectedClosers: string[];
    selectedSetters: string[];
    selectedCompany?: string;
  }) => void;
  loading?: boolean;
  profile: Profile | null;
}

export function FilterBar({ closers, setters, onFiltersChange, loading = false, profile }: FilterBarProps) {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 })
  });
  const [selectedClosers, setSelectedClosers] = useState<string[]>([]);
  const [selectedSetters, setSelectedSetters] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [expectingEndDate, setExpectingEndDate] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Fetch companies - always call the hook to avoid Rules of Hooks violation
  const { companies: allCompanies, loading: companiesLoading } = useCompanies();

  // Only use companies data for super admins
  const companies = profile?.role === 'super_admin' ? allCompanies : [];
  const shouldShowCompanyFilter = profile?.role === 'super_admin';

  // Debounce the filters to prevent excessive API calls
  const debouncedFilters = useDebounce({
    dateRange,
    selectedClosers,
    selectedSetters,
    selectedCompany: selectedCompany === "all" ? undefined : selectedCompany
  }, 300);

  // Use debounced filters to trigger API calls
  useEffect(() => {
    onFiltersChange(debouncedFilters);
  }, [debouncedFilters, onFiltersChange]);

  const handleDateRangeChange = useCallback((newRange: { start: Date; end: Date }) => {
    setDateRange(newRange);
    setIsApplyingFilters(true);
    setActivePreset(null); // Clear active preset when manually selecting dates
    // The debounced effect will handle the API call
  }, []);

  const clearDateRange = useCallback(() => {
    const defaultRange = {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 })
    };
    setDateRange(defaultRange);
    setExpectingEndDate(false);
  }, [today]);

  // Date range presets
  const datePresets = [
    {
      id: 'mtd',
      label: 'MTD',
      description: 'Month to Date',
      getRange: () => ({
        start: startOfMonth(today),
        end: today
      })
    },
    {
      id: 'ytd',
      label: 'YTD',
      description: 'Year to Date',
      getRange: () => ({
        start: startOfYear(today),
        end: today
      })
    },
    {
      id: 'last7',
      label: 'Last 7 Days',
      description: '7 days ago to today',
      getRange: () => ({
        start: subDays(today, 6),
        end: today
      })
    },
    {
      id: 'last14',
      label: 'Last 14 Days',
      description: '14 days ago to today',
      getRange: () => ({
        start: subDays(today, 13),
        end: today
      })
    },
    {
      id: 'last30',
      label: 'Last 30 Days',
      description: '30 days ago to today',
      getRange: () => ({
        start: subDays(today, 29),
        end: today
      })
    }
  ];

  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = datePresets.find(p => p.id === presetId);
    if (preset) {
      const range = preset.getRange();
      setDateRange(range);
      setActivePreset(presetId);
      setExpectingEndDate(false);
      setIsApplyingFilters(true);
    }
  }, [datePresets, today]);

  const resetFilters = useCallback(() => {
    const defaultRange = {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 })
    };
    setDateRange(defaultRange);
    setSelectedClosers([]);
    setSelectedSetters([]);
    setSelectedCompany("all");
    setExpectingEndDate(false);
    setActivePreset(null);
  }, [today]);

  return (
    <Card className="p-6 mb-6 bg-dashboard-surface border-border shadow-sm">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Filters</span>
            {(loading || isApplyingFilters) && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
          >
            <RotateCcw className="h-3 w-3" />
            Reset All
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Date Range Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full min-w-[240px] sm:min-w-[280px] justify-start text-left font-normal",
                    "hover:bg-dashboard-surface-hover"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.start, "MMM dd")} - {format(dateRange.end, "MMM dd, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-3">
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

                  {/* Quick Date Range Presets */}
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-2">Quick Ranges:</div>
                    <div className="flex flex-wrap gap-1">
                      {datePresets.map((preset) => (
                        <Button
                          key={preset.id}
                          variant={activePreset === preset.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetSelect(preset.id)}
                          className={cn(
                            "text-xs h-6 px-2",
                            activePreset === preset.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          )}
                          title={preset.description}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {expectingEndDate ? (
                      <span className="text-orange-600 font-medium">
                        Click to select end date
                      </span>
                    ) : (
                      <span className="text-blue-600 font-medium">
                        Click to select start date
                      </span>
                    )}
                  </div>
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
                      if (expectingEndDate) {
                        // We're expecting an end date (second click in cycle)
                        if (range.to) {
                          // Range is complete, use the end date
                          const endDate = range.to;
                          const startDate = dateRange.start;

                          if (startDate <= endDate) {
                            handleDateRangeChange({
                              start: startDate,
                              end: endDate
                            });
                          } else {
                            // If end date is before start, swap them
                            handleDateRangeChange({
                              start: endDate,
                              end: startDate
                            });
                          }
                          setExpectingEndDate(false);
                        } else {
                          // Only from date, check if it's the same as start (double-click)
                          if (range.from.getTime() === dateRange.start.getTime()) {
                            handleDateRangeChange({
                              start: range.from,
                              end: range.from
                            });
                            setExpectingEndDate(false);
                          } else {
                            // Different start date clicked, treat as new start date
                            handleDateRangeChange({
                              start: range.from,
                              end: range.from
                            });
                            setExpectingEndDate(true);
                          }
                        }
                      } else {
                        // We're expecting a start date (first click in cycle)
                        handleDateRangeChange({
                          start: range.from,
                          end: range.from // Temporarily set end to same as start for visual feedback
                        });
                        setExpectingEndDate(true);
                      }
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Company Filter - Only for Super Admins */}
          {shouldShowCompanyFilter && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company</label>
              <Select
                value={selectedCompany}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger className="w-full min-w-[180px] sm:min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <SelectValue placeholder="All Companies" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companiesLoading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading companies...
                      </div>
                    </SelectItem>
                  ) : (
                    companies.map((company) => (
                      <SelectItem key={company.company_id} value={company.company_id}>
                        {company.company_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Closers Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Closers</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full min-w-[180px] sm:min-w-[200px] justify-start text-left font-normal"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {selectedClosers.length === 0
                      ? "All Closers"
                      : selectedClosers.length === 1
                      ? selectedClosers[0]
                      : `${selectedClosers.length} selected`
                    }
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <div className="p-3 border-b">
                  <span className="text-sm font-medium">Select Closers</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  <div className="p-2 space-y-1">
                    <div
                      className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                      onClick={() => setSelectedClosers([])}
                    >
                      <div className={cn(
                        "h-4 w-4 border rounded-sm flex items-center justify-center",
                        selectedClosers.length === 0 ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {selectedClosers.length === 0 && (
                          <div className="h-2 w-2 bg-primary-foreground rounded-sm" />
                        )}
                      </div>
                      <span>All Closers</span>
                    </div>
                    {closers.map((closer) => (
                      <div
                        key={closer}
                        className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setSelectedClosers(prev =>
                            prev.includes(closer)
                              ? prev.filter(c => c !== closer)
                              : [...prev, closer]
                          );
                        }}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded-sm flex items-center justify-center",
                          selectedClosers.includes(closer) ? "bg-primary border-primary" : "border-muted-foreground"
                        )}>
                          {selectedClosers.includes(closer) && (
                            <div className="h-2 w-2 bg-primary-foreground rounded-sm" />
                          )}
                        </div>
                        <span>{closer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Setters Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Setters</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full min-w-[180px] sm:min-w-[200px] justify-start text-left font-normal"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {selectedSetters.length === 0
                      ? "All Setters"
                      : selectedSetters.length === 1
                      ? selectedSetters[0]
                      : `${selectedSetters.length} selected`
                    }
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <div className="p-3 border-b">
                  <span className="text-sm font-medium">Select Setters</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  <div className="p-2 space-y-1">
                    <div
                      className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                      onClick={() => setSelectedSetters([])}
                    >
                      <div className={cn(
                        "h-4 w-4 border rounded-sm flex items-center justify-center",
                        selectedSetters.length === 0 ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {selectedSetters.length === 0 && (
                          <div className="h-2 w-2 bg-primary-foreground rounded-sm" />
                        )}
                      </div>
                      <span>All Setters</span>
                    </div>
                    {setters.map((setter) => (
                      <div
                        key={setter}
                        className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setSelectedSetters(prev =>
                            prev.includes(setter)
                              ? prev.filter(s => s !== setter)
                              : [...prev, setter]
                          );
                        }}
                      >
                        <div className={cn(
                          "h-4 w-4 border rounded-sm flex items-center justify-center",
                          selectedSetters.includes(setter) ? "bg-primary border-primary" : "border-muted-foreground"
                        )}>
                          {selectedSetters.includes(setter) && (
                            <div className="h-2 w-2 bg-primary-foreground rounded-sm" />
                          )}
                        </div>
                        <span>{setter}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </Card>
  );
}
