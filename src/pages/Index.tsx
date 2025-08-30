import { useState, useMemo } from "react";
import { Users, Target, Calendar, TrendingUp, UserCheck, UserX, RotateCcw } from "lucide-react";
import { isWithinInterval, parseISO, startOfWeek, endOfWeek } from "date-fns";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AppointmentsTable } from "@/components/dashboard/AppointmentsTable";
import { AppointmentBreakdown } from "@/components/dashboard/AppointmentBreakdown";
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
    const rescheduled = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Rescheduled').length;
    const notInterested = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Not Interested').length;
    const disqualified = filteredAppointments.filter(apt => apt.confirmation_disposition === 'Disqualified').length;
    
    return {
      total,
      sits,
      rescheduled,
      notInterested,
      disqualified,
      rescheduledPercentage: total > 0 ? ((rescheduled / total) * 100).toFixed(1) : '0.0',
      notInterestedPercentage: total > 0 ? ((notInterested / total) * 100).toFixed(1) : '0.0',
      disqualifiedPercentage: total > 0 ? ((disqualified / total) * 100).toFixed(1) : '0.0',
    };
  }, [filteredAppointments]);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <DashboardHeader />
      
      <main className="container mx-auto px-6 py-6">
        {/* Filters */}
        <FilterBar
          closers={closers}
          setters={setters}
          onFiltersChange={setFilters}
        />

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <MetricCard
            title="Total Appointments"
            value={metrics.total}
            subtitle="All appointments in selected period"
            icon={Calendar}
            variant="info"
          />
          <MetricCard
            title="Total Sits"
            value={metrics.sits}
            subtitle="Successfully sat appointments"
            icon={UserCheck}
            variant="success"
          />
        </div>

        {/* Disposition Analysis Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Disposition Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Rescheduled"
              value={metrics.rescheduled}
              subtitle={`${metrics.rescheduledPercentage}% of total appointments`}
              icon={RotateCcw}
              variant="warning"
            />
            <MetricCard
              title="Not Interested"
              value={metrics.notInterested}
              subtitle={`${metrics.notInterestedPercentage}% of total appointments`}
              icon={UserX}
              variant="default"
            />
            <MetricCard
              title="Disqualified"
              value={metrics.disqualified}
              subtitle={`${metrics.disqualifiedPercentage}% of total appointments`}
              icon={Target}
              variant="default"
            />
          </div>
        </div>

        {/* Appointment Breakdown Section */}
        <AppointmentBreakdown appointments={filteredAppointments} />

        {/* Detailed Appointments Table */}
        <AppointmentsTable appointments={filteredAppointments} />
      </main>
    </div>
  );
};

export default Index;
