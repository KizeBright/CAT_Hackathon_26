import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, Skeleton } from './primitives';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  accentColor?: string;
  loading?: boolean;
}

export function StatCard({ label, value, change, trend, icon, accentColor = 'bg-primary', loading }: StatCardProps) {
  if (loading) return (
    <Card>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </Card>
  );

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-secondary mt-1">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trendColor}`}>
              <TrendIcon size={12} />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`${accentColor} p-2.5 rounded-lg text-secondary`}>{icon}</div>
      </div>
    </Card>
  );
}
