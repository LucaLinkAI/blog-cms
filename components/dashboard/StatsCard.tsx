import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
}

export function StatsCard({ label, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend && (
          <p
            className={`text-xs mt-1 ${
              trend.positive ? "text-green-600" : "text-red-500"
            }`}
          >
            {trend.positive ? "+" : ""}
            {trend.value} {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
