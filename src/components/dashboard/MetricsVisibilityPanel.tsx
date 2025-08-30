import { useState } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MetricsVisibilityPanelProps {
  visibleMetrics: Record<string, boolean>;
  onToggleMetric: (metric: string) => void;
}

export const MetricsVisibilityPanel = ({ visibleMetrics, onToggleMetric }: MetricsVisibilityPanelProps) => {
  const metricLabels = {
    totalAppointments: 'Total Appointments',
    totalSits: 'Total Sits', 
    totalCloses: 'Total Closes',
    noShows: 'No Shows',
    rescheduled: 'Rescheduled',
    notInterested: 'Not Interested',
    disqualified: 'Disqualified',
    appointmentBreakdown: 'Appointment Breakdown',
    detailedTable: 'Detailed Appointments Table',
    performanceChart: 'Performance Over Time Chart'
  };

  const handleShowAll = () => {
    Object.keys(visibleMetrics).forEach(metric => {
      if (!visibleMetrics[metric]) {
        onToggleMetric(metric);
      }
    });
  };

  const handleHideAll = () => {
    Object.keys(visibleMetrics).forEach(metric => {
      if (visibleMetrics[metric]) {
        onToggleMetric(metric);
      }
    });
  };

  return (
    <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            Metric Visibility & Order Settings
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Metric Visibility & Order Settings
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Toggle individual metrics on or off to customize your dashboard view. Drag metrics to reorder them.
            </p>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShowAll}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Show All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleHideAll}
                className="flex-1"
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Hide All
              </Button>
            </div>

            <div className="space-y-3">
              {Object.entries(visibleMetrics).map(([key, value]) => (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <Settings className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Label 
                      htmlFor={key} 
                      className="font-medium cursor-pointer"
                    >
                      {metricLabels[key as keyof typeof metricLabels] || key}
                    </Label>
                  </div>
                  <Switch
                    id={key}
                    checked={value}
                    onCheckedChange={() => onToggleMetric(key)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> Customize your dashboard by showing only the metrics that matter most to your workflow. Changes are applied instantly.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
  );
};