import { LucideIcon } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface Props {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  highlight?: "gold" | "silver" | "default";
  delay?: number;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, highlight = "default", delay = 0 }: Props) {
  const iconBg = highlight === "gold"
    ? "gold-gradient"
    : highlight === "silver"
    ? "bg-silver/20"
    : "bg-accent";

  return (
    <AnimatedSection delay={delay}>
      <div className="stat-card">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${highlight === "gold" ? "text-primary-foreground" : highlight === "silver" ? "text-silver" : "text-primary"}`} />
          </div>
          {trend && (
            <span className={`text-xs font-medium ${trendUp ? "text-emerald-400" : "text-destructive"}`}>
              {trend}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm mb-1">{title}</p>
        <p className={`text-2xl font-semibold tracking-tight ${highlight === "gold" ? "gold-text" : ""}`}>{value}</p>
      </div>
    </AnimatedSection>
  );
}
