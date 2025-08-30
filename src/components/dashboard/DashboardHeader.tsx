import { Building2 } from "lucide-react";

interface DashboardHeaderProps {
  clientName?: string;
  logoUrl?: string;
}

export function DashboardHeader({ 
  clientName = "{{client_name}}", 
  logoUrl = "[INSERT_LOGO_URL_HERE]" 
}: DashboardHeaderProps) {
  return (
    <header className="w-full bg-card border-b border-border px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {logoUrl !== "[INSERT_LOGO_URL_HERE]" ? (
            <img 
              src={logoUrl} 
              alt="Roofing AI Systems" 
              className="h-10 w-auto"
              onError={(e) => {
                // Fallback to icon if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">Roofing AI Systems</h1>
            <p className="text-sm text-muted-foreground">Analytics Dashboard</p>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Client:</p>
            <p className="text-lg font-bold text-primary">{clientName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}