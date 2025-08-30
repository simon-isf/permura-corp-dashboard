import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment } from "@/data/mockData";

interface AppointmentBreakdownProps {
  appointments: Appointment[];
}

export function AppointmentBreakdown({ appointments }: AppointmentBreakdownProps) {
  const colors = ['#ef4444', '#3b82f6', '#eab308', '#f97316']; // red, blue, yellow, orange

  const breakdownData = useMemo(() => {
    const total = appointments.length;
    if (total === 0) return [];
    
    // Credit Score Breakdown
    const creditScoreRanges = {
      '600-650': 0,
      '651-700': 0,
      '701-750': 0,
      '751-800': 0,
    };
    
    appointments.forEach(apt => {
      const score = apt.credit_score;
      if (score >= 600 && score <= 650) creditScoreRanges['600-650']++;
      else if (score >= 651 && score <= 700) creditScoreRanges['651-700']++;
      else if (score >= 701 && score <= 750) creditScoreRanges['701-750']++;
      else if (score >= 751 && score <= 800) creditScoreRanges['751-800']++;
    });

    // Roof Type Breakdown
    const roofTypes = appointments.reduce((acc, apt) => {
      acc[apt.roof_type] = (acc[apt.roof_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Existing Solar Breakdown
    const solarBreakdown = appointments.reduce((acc, apt) => {
      const key = apt.existing_solar ? 'Yes' : 'No';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Shading Breakdown
    const shadingBreakdown = appointments.reduce((acc, apt) => {
      acc[apt.shading] = (acc[apt.shading] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Appointment Type Breakdown
    const appointmentTypes = appointments.reduce((acc, apt) => {
      acc[apt.appointment_type] = (acc[apt.appointment_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const createSegments = (data: Record<string, number>) => {
      const entries = Object.entries(data);
      return entries.map(([category, count], index) => ({
        category,
        count,
        percentage: (count / total) * 100,
        color: colors[index % colors.length]
      }));
    };

    return [
      { title: 'Credit Score Ranges', segments: createSegments(creditScoreRanges) },
      { title: 'Roof Type', segments: createSegments(roofTypes) },
      { title: 'Existing Solar', segments: createSegments(solarBreakdown) },
      { title: 'Shading', segments: createSegments(shadingBreakdown) },
      { title: 'Appointment Type', segments: createSegments(appointmentTypes) }
    ];
  }, [appointments]);

  const HorizontalSegmentedBar = ({ title, segments }: { title: string, segments: any[] }) => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="w-full">
        <div className="flex h-6 w-full rounded-full overflow-hidden bg-muted">
          {segments.map((segment, index) => (
            <div
              key={segment.category}
              className="h-full transition-all duration-300 hover:opacity-80"
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
              }}
              title={`${segment.category}: ${segment.percentage.toFixed(1)}% (${segment.count})`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {segments.map((segment, index) => (
            <div key={segment.category} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-muted-foreground">
                {segment.category}: {segment.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">Appointment Breakdown</h2>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {breakdownData.map((item, index) => (
              <HorizontalSegmentedBar key={index} title={item.title} segments={item.segments} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
