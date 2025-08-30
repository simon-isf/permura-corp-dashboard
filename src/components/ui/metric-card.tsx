import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string | React.ReactNode;
  percentage?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'info';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'border-border',
    icon: 'text-primary',
    value: 'text-foreground',
    trend: {
      up: 'text-success',
      down: 'text-destructive',
      neutral: 'text-muted-foreground'
    }
  },
  success: {
    card: 'border-success/20 bg-gradient-to-br from-success/5 to-success/10',
    icon: 'text-success',
    value: 'text-success',
    trend: {
      up: 'text-success',
      down: 'text-destructive',
      neutral: 'text-muted-foreground'
    }
  },
  warning: {
    card: 'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10',
    icon: 'text-warning',
    value: 'text-warning',
    trend: {
      up: 'text-success',
      down: 'text-destructive',
      neutral: 'text-muted-foreground'
    }
  },
  info: {
    card: 'border-info/20 bg-gradient-to-br from-info/5 to-info/10',
    icon: 'text-info',
    value: 'text-info',
    trend: {
      up: 'text-success',
      down: 'text-destructive',
      neutral: 'text-muted-foreground'
    }
  }
};

export function MetricCard({
  title,
  value,
  subtitle,
  percentage,
  trend = 'neutral',
  icon: Icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-card-hover border-2",
      styles.card,
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4", styles.icon)} />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className={cn("text-2xl font-bold", styles.value)}>
              {value}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </div>
            )}
          </div>
          {percentage && (
            <div className={cn(
              "text-xs font-medium",
              styles.trend[trend]
            )}>
              {percentage}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}