import { Card } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export const MetricCard = ({ title, value, subtitle }: MetricCardProps) => {
  return (
    <Card className="p-6 bg-metric-bg border-metric-border hover:shadow-lg transition-shadow duration-200">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};