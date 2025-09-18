import { useState, useEffect } from "react";
import { Users, Target, Calendar, TrendingUp, UserCheck, UserX, RotateCcw, XCircle, CheckCircle } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

// Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { AppointmentsTable } from "@/components/dashboard/AppointmentsTable";
import { AppointmentBreakdown } from "@/components/dashboard/AppointmentBreakdown";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { MetricCard } from "@/components/ui/metric-card";
import { Navigation } from "@/components/layout/Navigation";
import { Progress } from "@/components/ui/progress";
import { LoadingTimeout } from "@/components/LoadingTimeout";

// Hooks and Services
import { useAppointments } from "@/hooks/useAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { AppointmentFilters } from "@/services/appointmentsService";

const Index = () => {
  const { profile, isSuperAdmin } = useAuth();
  const today = new Date();

  // Initialize filters without conditional logic to avoid hook order issues
  const [filters, setFilters] = useState<AppointmentFilters>(() => ({
    dateRange: {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 })
    },
    selectedClosers: [],
    selectedSetters: [],
    selectedCompany: undefined // Will be set in useEffect
  }));

  // Update company filter when profile loads to avoid hook order issues
  useEffect(() => {
    if (profile && !isSuperAdmin) {
      setFilters(prev => ({
        ...prev,
        selectedCompany: profile.company_id || undefined
      }));
    }
  }, [profile, isSuperAdmin]);

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

  // Fetch real data using the hook
  const { appointments, metrics, uniqueClosers, uniqueSetters, loading, error } = useAppointments(filters);

  // Loading progress state for subtle progress indication
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate loading progress when data is being fetched
  useEffect(() => {
    if (loading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // Stop at 90% until actual loading completes
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      // Complete the progress when loading finishes
      setLoadingProgress(100);
      const timeout = setTimeout(() => setLoadingProgress(0), 500);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Show initial loading state only on first load
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
    }
  }, [loading, hasInitiallyLoaded]);

  const toggleMetric = (metric: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  // Handle initial loading state (only show full page loading on first load)
  if (loading && !hasInitiallyLoaded) {
    return (
      <LoadingTimeout
        isLoading={loading}
        timeoutMs={30000}
        onTimeout={() => console.warn('Initial data loading timed out')}
        onRetry={() => window.location.reload()}
      >
        <div className="min-h-screen bg-dashboard-bg">
          <Navigation />
          <DashboardHeader
            visibleMetrics={visibleMetrics}
            onToggleMetric={toggleMetric}
          />
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </div>
      </LoadingTimeout>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Error loading dashboard data: {error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Navigation />
      <DashboardHeader
        visibleMetrics={visibleMetrics}
        onToggleMetric={toggleMetric}
      />

      <main className="container mx-auto px-6 py-6 relative">
        {/* Subtle loading progress bar */}
        {loadingProgress > 0 && loadingProgress < 100 && (
          <div className="mb-4">
            <Progress
              value={loadingProgress}
              className="h-1 bg-muted"
            />
          </div>
        )}

        {/* Filters */}
        <FilterBar
          closers={uniqueClosers}
          setters={uniqueSetters}
          onFiltersChange={setFilters}
          loading={loading && hasInitiallyLoaded}
          profile={profile}
        />

        {/* Subtle Loading Overlay for Filter Updates */}
        {loading && hasInitiallyLoaded && (
          <div className="absolute inset-0 bg-dashboard-bg/60 backdrop-blur-sm z-10 flex items-center justify-center p-4 transition-all duration-300 ease-in-out animate-in fade-in-0 duration-300">
            <div className="bg-dashboard-surface/95 backdrop-blur-md border border-border rounded-lg p-4 sm:p-6 shadow-card-hover animate-in zoom-in-95 duration-300 delay-75 max-w-sm w-full">
              <div className="flex items-center gap-3">
                <div className="spinner-enhanced rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-foreground">Updating filters...</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">Refreshing dashboard data</p>
                </div>
              </div>
              {/* Progress indicator */}
              <div className="mt-3 w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: `${Math.min(loadingProgress, 90)}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content with Smooth Transitions */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          loading && hasInitiallyLoaded && "filter-updating"
        )}>
          {/* Performance Over Time Chart */}
          {visibleMetrics.performanceChart && (
            <div className="card-transition">
              <TimeSeriesChart appointments={appointments} dateRange={filters.dateRange} />
            </div>
          )}

          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {visibleMetrics.totalAppointments && (
              <div className="card-transition">
                <MetricCard
                  title="Total Appointments"
                  value={metrics.totalAppointments}
                  subtitle="All appointments in selected period"
                  icon={Calendar}
                  variant="info"
                />
              </div>
            )}
            {visibleMetrics.totalSits && (
              <div className="card-transition">
                <MetricCard
                  title="Total Sits"
                  value={metrics.totalSits}
                  subtitle={`Sit Rate: ${metrics.sitRate.toFixed(1)}%`}
                  icon={UserCheck}
                  variant="success"
                />
              </div>
            )}
            {visibleMetrics.totalCloses && (
              <div className="card-transition">
                <MetricCard
                  title="Total Closes"
                  value={metrics.totalCloses}
                  subtitle={`Close Rate: ${metrics.closeRate.toFixed(1)}%`}
                  icon={CheckCircle}
                  variant="success"
                />
              </div>
            )}
          </div>

          {/* Disposition Analysis Section */}
          {(visibleMetrics.noShows || visibleMetrics.rescheduled || visibleMetrics.notInterested || visibleMetrics.disqualified) && (
            <div className="mb-8 card-transition">
              <h2 className="text-xl font-semibold text-foreground mb-4">Disposition Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {visibleMetrics.noShows && (
                  <div className="card-transition">
                    <MetricCard
                      title="No Show"
                      value={metrics.noShows}
                      subtitle={`${metrics.totalAppointments > 0 ? ((metrics.noShows / metrics.totalAppointments) * 100).toFixed(1) : '0.0'}% of total`}
                      icon={XCircle}
                      variant="default"
                    />
                  </div>
                )}
                {visibleMetrics.rescheduled && (
                  <div className="card-transition">
                    <MetricCard
                      title="Rescheduled"
                      value={metrics.rescheduled}
                      subtitle={`${metrics.totalAppointments > 0 ? ((metrics.rescheduled / metrics.totalAppointments) * 100).toFixed(1) : '0.0'}% of total`}
                      icon={RotateCcw}
                      variant="warning"
                    />
                  </div>
                )}
                {visibleMetrics.notInterested && (
                  <div className="card-transition">
                    <MetricCard
                      title="Not Interested"
                      value={metrics.notInterested}
                      subtitle={`${metrics.totalAppointments > 0 ? ((metrics.notInterested / metrics.totalAppointments) * 100).toFixed(1) : '0.0'}% of total`}
                      icon={UserX}
                      variant="default"
                    />
                  </div>
                )}
                {visibleMetrics.disqualified && (
                  <div className="card-transition">
                    <MetricCard
                      title="Disqualified"
                      value={metrics.disqualified}
                      subtitle={`${metrics.totalAppointments > 0 ? ((metrics.disqualified / metrics.totalAppointments) * 100).toFixed(1) : '0.0'}% of total`}
                      icon={Target}
                      variant="default"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointment Breakdown Section */}
          {visibleMetrics.appointmentBreakdown && (
            <div className="card-transition">
              <AppointmentBreakdown appointments={appointments} />
            </div>
          )}

          {/* Detailed Appointments Table */}
          {visibleMetrics.detailedTable && (
            <div className="card-transition">
              <AppointmentsTable appointments={appointments} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
