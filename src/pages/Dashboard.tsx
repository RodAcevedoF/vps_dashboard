import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Container, HealthStatus, QueueStats } from '../types';
import ContainerCard from '../components/ContainerCard';
import HealthBadge from '../components/HealthBadge';
import LogDrawer from '../components/LogDrawer';
import QueueStatsComponent from '../components/QueueStats';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [queues, setQueues] = useState<QueueStats[]>([]);
  const [healthStatuses, setHealthStatuses] = useState({
    redis: null as HealthStatus | null,
    postgres: null as HealthStatus | null,
    neo4j: null as HealthStatus | null,
    apiProd: null as HealthStatus | null,
    apiStaging: null as HealthStatus | null,
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch containers
  const fetchContainers = async () => {
    try {
      const data = await api.getContainers();
      setContainers(data);
    } catch (error) {
      console.error('Failed to fetch containers:', error);
    }
  };

  // Fetch health statuses
  const fetchHealthStatuses = async () => {
    try {
      const [redis, postgres, neo4j, apiProd, apiStaging] = await Promise.allSettled([
        api.getRedisHealth(),
        api.getPostgresHealth(),
        api.getNeo4jHealth(),
        api.getApiHealth('prod'),
        api.getApiHealth('staging'),
      ]);

      setHealthStatuses({
        redis: redis.status === 'fulfilled' ? redis.value : null,
        postgres: postgres.status === 'fulfilled' ? postgres.value : null,
        neo4j: neo4j.status === 'fulfilled' ? neo4j.value : null,
        apiProd: apiProd.status === 'fulfilled' ? apiProd.value : null,
        apiStaging: apiStaging.status === 'fulfilled' ? apiStaging.value : null,
      });
    } catch (error) {
      console.error('Failed to fetch health statuses:', error);
    }
  };

  // Fetch queues
  const fetchQueues = async () => {
    try {
      const data = await api.getQueues();
      setQueues(data);
    } catch (error) {
      console.error('Failed to fetch queues:', error);
    }
  };

  // Fetch all data
  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchContainers(), fetchHealthStatuses(), fetchQueues()]);
    setLoading(false);
  };

  // Handle container actions
  const handleContainerAction = async (
    id: string,
    action: 'start' | 'stop' | 'restart'
  ) => {
    setActionLoading(true);
    try {
      if (action === 'start') await api.startContainer(id);
      else if (action === 'stop') await api.stopContainer(id);
      else if (action === 'restart') await api.restartContainer(id);

      // Refresh containers after action
      setTimeout(fetchContainers, 1000);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
      alert(`Failed to ${action} container`);
    } finally {
      setActionLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAll();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAll, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Group containers
  const sagepointContainers = containers.filter((c) =>
    c.name.startsWith('sagepoint')
  );
  const otherContainers = containers.filter(
    (c) => !c.name.startsWith('sagepoint')
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">VPS Dashboard</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded transition"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Health Status */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Infrastructure Health</h2>
          <div className="flex flex-wrap gap-3">
            <HealthBadge status={healthStatuses.redis} loading={loading} label="Redis" />
            <HealthBadge status={healthStatuses.postgres} loading={loading} label="PostgreSQL" />
            <HealthBadge status={healthStatuses.neo4j} loading={loading} label="Neo4j" />
            <HealthBadge status={healthStatuses.apiProd} loading={loading} label="API (Prod)" />
            <HealthBadge status={healthStatuses.apiStaging} loading={loading} label="API (Staging)" />
          </div>
        </div>

        {/* Queue Stats */}
        <QueueStatsComponent queues={queues} loading={loading} />

        {/* Sagepoint Containers */}
        <div>
          <h2 className="text-xl font-bold mb-4">Sagepoint Containers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sagepointContainers.map((container) => (
              <ContainerCard
                key={container.id}
                container={container}
                onAction={handleContainerAction}
                onViewLogs={(id) =>
                  setSelectedContainer({ id, name: container.name })
                }
                loading={actionLoading}
              />
            ))}
          </div>
        </div>

        {/* Other Containers */}
        {otherContainers.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Other Containers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherContainers.map((container) => (
                <ContainerCard
                  key={container.id}
                  container={container}
                  onAction={handleContainerAction}
                  onViewLogs={(id) =>
                    setSelectedContainer({ id, name: container.name })
                  }
                  loading={actionLoading}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Log Drawer */}
      {selectedContainer && (
        <LogDrawer
          containerId={selectedContainer.id}
          containerName={selectedContainer.name}
          onClose={() => setSelectedContainer(null)}
        />
      )}
    </div>
  );
}
