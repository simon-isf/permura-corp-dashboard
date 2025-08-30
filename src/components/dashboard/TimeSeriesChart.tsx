import { useState, useMemo } from 'react';
import { format, eachDayOfInterval, parseISO, isSameDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Appointment } from '@/data/mockData';

interface TimeSeriesChartProps {
  appointments: Appointment[];
  dateRange: { start: Date; end: Date };
}

export const TimeSeriesChart = ({ appointments, dateRange }: TimeSeriesChartProps) => {
  const [visibleMetrics, setVisibleMetrics] = useState({
    totalAppointments: true,
    totalSits: true,
    totalNoShows: false,
    totalReschedules: false,
    totalDisqualifies: false,
    totalFollowUps: false,
    totalCloses: false,
  });

  const chartData = useMemo(() => {
    const days = eachDayOfInterval(dateRange);
    
    return days.map(day => {
      const dayAppointments = appointments.filter(apt => 
        isSameDay(parseISO(apt.booked_for), day)
      );
      
      return {
        date: format(day, 'MMM dd'),
        fullDate: format(day, 'yyyy-MM-dd'),
        totalAppointments: dayAppointments.length,
        totalSits: dayAppointments.filter(apt => apt.confirmation_disposition === 'Sat').length,
        totalNoShows: dayAppointments.filter(apt => apt.confirmation_disposition === 'No Show').length,
        totalReschedules: dayAppointments.filter(apt => apt.confirmation_disposition === 'Rescheduled').length,
        totalDisqualifies: dayAppointments.filter(apt => apt.confirmation_disposition === 'Disqualified').length,
        totalFollowUps: dayAppointments.filter(apt => apt.confirmation_disposition === 'Follow-up').length,
        totalCloses: dayAppointments.filter(apt => apt.confirmation_disposition === 'Closed').length,
      };
    });
  }, [appointments, dateRange]);

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  const metricColors = {
    totalAppointments: '#10b981', // emerald-500
    totalSits: '#3b82f6', // blue-500
    totalNoShows: '#ef4444', // red-500
    totalReschedules: '#f59e0b', // amber-500
    totalDisqualifies: '#6b7280', // gray-500
    totalFollowUps: '#8b5cf6', // violet-500
    totalCloses: '#06b6d4', // cyan-500
  };

  const metricLabels = {
    totalAppointments: 'Total Appointments',
    totalSits: 'Total Sits',
    totalNoShows: 'Total No-Shows',
    totalReschedules: 'Total Reschedules',
    totalDisqualifies: 'Total Disqualifies',
    totalFollowUps: 'Total Follow-ups',
    totalCloses: 'Total Closes',
  };

  return (
    <div className="mb-8">
      <Card className="border-dashboard-border bg-dashboard-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-dashboard-accent">Performance Over Time</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            {Object.entries(visibleMetrics).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={value}
                  onCheckedChange={() => toggleMetric(key as keyof typeof visibleMetrics)}
                />
                <Label
                  htmlFor={key}
                  className="text-sm font-medium text-dashboard-muted cursor-pointer"
                  style={{ color: metricColors[key as keyof typeof metricColors] }}
                >
                  {metricLabels[key as keyof typeof metricLabels]}
                </Label>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                
                {visibleMetrics.totalAppointments && (
                  <Line
                    type="monotone"
                    dataKey="totalAppointments"
                    stroke={metricColors.totalAppointments}
                    strokeWidth={2}
                    name="Total Appointments"
                    dot={{ fill: metricColors.totalAppointments, strokeWidth: 2, r: 4 }}
                  />
                )}
                {visibleMetrics.totalSits && (
                  <Line
                    type="monotone"
                    dataKey="totalSits"
                    stroke={metricColors.totalSits}
                    strokeWidth={2}
                    name="Total Sits"
                    dot={{ fill: metricColors.totalSits, strokeWidth: 2, r: 4 }}
                  />
                )}
                {visibleMetrics.totalNoShows && (
                  <Line
                    type="monotone"
                    dataKey="totalNoShows"
                    stroke={metricColors.totalNoShows}
                    strokeWidth={2}
                    name="Total No-Shows"
                    dot={{ fill: metricColors.totalNoShows, strokeWidth: 2, r: 4 }}
                  />
                )}
                {visibleMetrics.totalReschedules && (
                  <Line
                    type="monotone"
                    dataKey="totalReschedules"
                    stroke={metricColors.totalReschedules}
                    strokeWidth={2}
                    name="Total Reschedules"
                    dot={{ fill: metricColors.totalReschedules, strokeWidth: 2, r: 4 }}
                  />
                )}
                {visibleMetrics.totalDisqualifies && (
                  <Line
                    type="monotone"
                    dataKey="totalDisqualifies"
                    stroke={metricColors.totalDisqualifies}
                    strokeWidth={2}
                    name="Total Disqualifies"
                    dot={{ fill: metricColors.totalDisqualifies, strokeWidth: 2, r: 4 }}
                  />
                )}
                {visibleMetrics.totalFollowUps && (
                  <Line
                    type="monotone"
                    dataKey="totalFollowUps"
                    stroke={metricColors.totalFollowUps}
                    strokeWidth={2}
                    name="Total Follow-ups"
                    dot={{ fill: metricColors.totalFollowUps, strokeWidth: 2, r: 4 }}
                  />
                )}
                {visibleMetrics.totalCloses && (
                  <Line
                    type="monotone"
                    dataKey="totalCloses"
                    stroke={metricColors.totalCloses}
                    strokeWidth={2}
                    name="Total Closes"
                    dot={{ fill: metricColors.totalCloses, strokeWidth: 2, r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};