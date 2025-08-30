import { Building2 } from "lucide-react";
import { MetricsVisibilityPanel } from "./MetricsVisibilityPanel";

interface DashboardHeaderProps {
  clientName?: string;
  logoUrl?: string;
  visibleMetrics?: Record<string, boolean>;
  onToggleMetric?: (metric: string) => void;
}

export function DashboardHeader({ 
  clientName = "{{client_name}}", 
  logoUrl = "[INSERT_LOGO_URL_HERE]",
  visibleMetrics,
  onToggleMetric
}: DashboardHeaderProps) {
  return (
    <header className="w-full bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/58030552-ef5b-484d-bb0e-66450b796c1d.png" 
            alt="Premura Call Center Dashboard" 
            className="h-12 w-12 rounded-lg"
            onError={(e) => {
              // Fallback to icon if image fails to load
              const fallback = document.createElement('div');
              fallback.className = 'h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center';
              fallback.innerHTML = '<svg class="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/></svg>';
              (e.target as HTMLImageElement).parentNode?.replaceChild(fallback, e.target as HTMLImageElement);
            }}
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">Premura Call Center Dashboard</h1>
            <p className="text-sm text-muted-foreground">Analytics Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <p className="text-lg font-bold text-primary">{clientName}</p>
        </div>

        <div className="flex items-center">
          {visibleMetrics && onToggleMetric && (
            <MetricsVisibilityPanel 
              visibleMetrics={visibleMetrics}
              onToggleMetric={onToggleMetric}
            />
          )}
        </div>
      </div>
    </header>
  );
}