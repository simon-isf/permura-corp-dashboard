import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Appointment } from "@/data/mockData";

interface AppointmentBreakdownProps {
  appointments: Appointment[];
}

export function AppointmentBreakdown({ appointments }: AppointmentBreakdownProps) {
  const breakdownData = useMemo(() => {
    const total = appointments.length;
    
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

    const creditScoreData = Object.entries(creditScoreRanges).map(([range, count]) => ({
      category: range,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      count
    }));

    // Roof Type Breakdown
    const roofTypes = appointments.reduce((acc, apt) => {
      acc[apt.roof_type] = (acc[apt.roof_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const roofTypeData = Object.entries(roofTypes).map(([type, count]) => ({
      category: type,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      count
    }));

    // Existing Solar Breakdown
    const solarBreakdown = appointments.reduce((acc, apt) => {
      const key = apt.existing_solar ? 'Yes' : 'No';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const solarData = Object.entries(solarBreakdown).map(([status, count]) => ({
      category: status,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      count
    }));

    // Shading Breakdown
    const shadingBreakdown = appointments.reduce((acc, apt) => {
      acc[apt.shading] = (acc[apt.shading] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const shadingData = Object.entries(shadingBreakdown).map(([status, count]) => ({
      category: status,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      count
    }));

    // Appointment Type Breakdown
    const appointmentTypes = appointments.reduce((acc, apt) => {
      acc[apt.appointment_type] = (acc[apt.appointment_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const appointmentTypeData = Object.entries(appointmentTypes).map(([type, count]) => ({
      category: type,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0',
      count
    }));

    return {
      creditScore: creditScoreData,
      roofType: roofTypeData,
      existingSolar: solarData,
      shading: shadingData,
      appointmentType: appointmentTypeData
    };
  }, [appointments]);

  const chartConfig = {
    percentage: {
      label: "Percentage",
      color: "hsl(var(--primary))",
    },
  };

  const BreakdownChart = ({ data, title }: { data: any[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [
                      `${value}% (${data.find(d => d.percentage === value)?.count || 0} appointments)`,
                      "Percentage"
                    ]}
                  />
                } 
              />
              <Bar 
                dataKey="percentage" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">Appointment Breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <BreakdownChart data={breakdownData.creditScore} title="Credit Score Ranges" />
        <BreakdownChart data={breakdownData.roofType} title="Roof Type" />
        <BreakdownChart data={breakdownData.existingSolar} title="Existing Solar" />
        <BreakdownChart data={breakdownData.shading} title="Shading" />
        <BreakdownChart data={breakdownData.appointmentType} title="Appointment Type" />
      </div>
    </div>
  );
}
