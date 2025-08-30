import { useState, useMemo } from "react";
import { Users, Target, Calendar, TrendingUp, UserCheck, UserX, RotateCcw, XCircle, CheckCircle } from "lucide-react";
import { isWithinInterval, parseISO, startOfWeek, endOfWeek } from "date-fns";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AppointmentsTable } from "@/components/dashboard/AppointmentsTable";
import { AppointmentBreakdown } from "@/components/dashboard/AppointmentBreakdown";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { MetricsVisibilityPanel } from "@/components/dashboard/MetricsVisibilityPanel";
import { MetricCard } from "@/components/ui/metric-card";

// Data
import { mockAppointments, Appointment } from "@/data/mockData";

const Index = () => {
  const today = new Date();
  const [filters, setFilters] = useState({
    dateRange: { 
      start: startOfWeek(today, { weekStartsOn: 1 }), 
      end: endOfWeek(today, { weekStartsOn: 1 }) 
    },
    selectedClosers: [] as string[],
    selectedSetters: [] as string[]
  });

  const [visibleMetrics, setVisibleMetrics] = useState({
    totalAppointments: true,
    totalSits: true,
    totalCloses: true,
    noShows: true,
    rescheduled: true,
    notInterested: true,
    disqualified: true,
    appointmentBreakdown: true,
    detailedTable: true,
    performanceChart: true
  });

  // Extract unique closers and setters
  const closers = useMemo(() => 
    [...new Set(mockAppointments.map(apt => apt.closer_name))].sort(),
    []
  );
  
  const setters = useMemo(() => 
    [...new Set(mockAppointments.map(apt => apt.setter_name))].sort(),
    []
  );

  // Filter appointments based on current filters
  const filteredAppointments = useMemo(() => {
    return mockAppointments.filter(appointment => {
      // Date range filter
      const appointmentDate = parseISO(appointment.booked_for);
      const isInDateRange = isWithinInterval(appointmentDate, {
        start: filters.dateRange.start,
        end: filters.dateRange.end
      });
      
      // Closer filter
      const closerMatch = filters.selectedClosers.length === 0 || 
        filters.selectedClosers.includes(appointment.closer_name);
      
      // Setter filter
      const setterMatch = filters.selectedSetters.length === 0 || 
        filters.selectedSetters.includes(appointment.setter_name);
      
      return isInDateRange && closerMatch && setterMatch;
    });
  }, [filters]);

  // Calculate KPIs
  const metrics = useMemo(() => {
    const total = filteredAppointments.length;
    const sits = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Sat').length;
    const closes = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Closed').length;
    const noShows = filteredAppointments.filter(apt => apt.confirmation_disposition === 'No Show').length;
    const rescheduled = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Rescheduled').length;
    const notInterested = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Not Interested').length;
    const disqualified = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Disqualified').length;
    
    return {
      total,
      sits,
      closes,
      noShows,
      rescheduled,
      notInterested,
      disqualified,
      noShowsPercentage: total > 0 ? ((noShows / total) * 100).toFixed(1) : '0.0',
      rescheduledPercentage: total > 0 ? ((rescheduled / total) * 100).toFixed(1) : '0.0',
      notInterestedPercentage: total > 0 ? ((notInterested / total) * 100).toFixed(1) : '0.0',
      disqualifiedPercentage: total > 0 ? ((disqualified / total) * 100).toFixed(1) : '0.0',
    };
  }, [filteredAppointments]);

  const toggleMetric = (metric: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <DashboardHeader />
      
      <main className="container mx-auto px-6 py-6">
        {/* Metrics Visibility Panel */}
        <MetricsVisibilityPanel 
          visibleMetrics={visibleMetrics}
          onToggleMetric={toggleMetric}
        />

        {/* Filters */}
        <FilterBar
          closers={closers}
          setters={setters}
          onFiltersChange={setFilters}
        />

        {/* Performance Over Time Chart */}
        {visibleMetrics.performanceChart && (
          <TimeSeriesChart appointments={filteredAppointments} dateRange={filters.dateRange} />
        )}

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {visibleMetrics.totalAppointments && (
            <MetricCard
              title="Total Appointments"
              value={metrics.total}
              subtitle="All appointments in selected period"
              icon={Calendar}
              variant="info"
            />
          )}
          {visibleMetrics.totalSits && (
            <MetricCard
              title="Total Sits"
              value={metrics.sits}
              subtitle="Successfully sat appointments"
              icon={UserCheck}
              variant="success"
            />
          )}
          {visibleMetrics.totalCloses && (
            <MetricCard
              title="Total Closes"
              value={metrics.closes}
              subtitle="Successfully closed deals"
              icon={CheckCircle}
              variant="success"
            />
          )}
        </div>

        {/* Disposition Analysis Section */}
        {(visibleMetrics.noShows || visibleMetrics.rescheduled || visibleMetrics.notInterested || visibleMetrics.disqualified) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Disposition Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {visibleMetrics.noShows && (
                <MetricCard
                  title="No Show"
                  value={metrics.noShows}
                  subtitle={`${metrics.noShowsPercentage}% of total appointments`}
                  icon={XCircle}
                  variant="default"
                />
              )}
              {visibleMetrics.rescheduled && (
                <MetricCard
                  title="Rescheduled"
                  value={metrics.rescheduled}
                  subtitle={`${metrics.rescheduledPercentage}% of total appointments`}
                  icon={RotateCcw}
                  variant="warning"
                />
              )}
              {visibleMetrics.notInterested && (
                <MetricCard
                  title="Not Interested"
                  value={metrics.notInterested}
                  subtitle={`${metrics.notInterestedPercentage}% of total appointments`}
                  icon={UserX}
                  variant="default"
                />
              )}
              {visibleMetrics.disqualified && (
                <MetricCard
                  title="Disqualified"
                  value={metrics.disqualified}
                  subtitle={`${metrics.disqualifiedPercentage}% of total appointments`}
                  icon={Target}
                  variant="default"
                />
              )}
            </div>
          </div>
        )}

        {/* Appointment Breakdown Section */}
        {visibleMetrics.appointmentBreakdown && (
          <AppointmentBreakdown appointments={filteredAppointments} />
        )}

        {/* Detailed Appointments Table */}
        {visibleMetrics.detailedTable && (
          <AppointmentsTable appointments={filteredAppointments} />
        )}
      </main>
    </div>
  );
};

export default Index;
