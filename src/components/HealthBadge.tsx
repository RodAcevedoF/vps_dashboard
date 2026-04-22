import type { HealthStatus } from '../types';

interface HealthBadgeProps {
  status: HealthStatus | null;
  loading: boolean;
  label: string;
}

export default function HealthBadge({ status, loading, label }: HealthBadgeProps) {
  if (loading) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse mr-2" />
        <span className="text-sm text-gray-300">{label}</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700">
        <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
        <span className="text-sm text-gray-300">{label}</span>
      </div>
    );
  }

  const isHealthy = status.status === 'healthy';

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full ${
        isHealthy ? 'bg-green-900/30' : 'bg-red-900/30'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          isHealthy ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span
        className={`text-sm ${
          isHealthy ? 'text-green-300' : 'text-red-300'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
