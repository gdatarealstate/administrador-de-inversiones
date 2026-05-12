import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accentColor?: "default" | "accent" | "success" | "destructive" | "info";
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = "default",
}: KPICardProps) {
  const iconBgMap = {
    default: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  };

  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgMap[accentColor]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={trend.positive ? "kpi-trend-up" : "kpi-trend-down"}>
            <span className="flex items-center gap-1">
              {trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend.value}
            </span>
          </div>
        )}
      </div>
      <p className="kpi-label">{title}</p>
      <p className="kpi-value mt-1 mono">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
