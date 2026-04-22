import type { Container } from '../types';

interface ContainerCardProps {
  container: Container;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  onViewLogs: (id: string) => void;
  loading: boolean;
}

export default function ContainerCard({
  container,
  onAction,
  onViewLogs,
  loading,
}: ContainerCardProps) {
  const isRunning = container.state === 'running';
  const isStopped = container.state === 'exited' || container.state === 'stopped';

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    if (mb < 1024) return `${mb.toFixed(0)}MB`;
    return `${(mb / 1024).toFixed(1)}GB`;
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running':
        return 'bg-green-500';
      case 'exited':
      case 'stopped':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${getStateColor(container.state)}`} />
            <h3 className="text-lg font-semibold text-white">{container.name}</h3>
          </div>
          <p className="text-sm text-gray-400">{container.image}</p>
          <p className="text-xs text-gray-500 mt-1">{container.status}</p>
        </div>
      </div>

      {isRunning && container.stats && (
        <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-900/50 rounded">
          <div>
            <p className="text-xs text-gray-400 mb-1">CPU</p>
            <p className="text-sm font-mono text-white">{container.stats.cpu}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Memory</p>
            <p className="text-sm font-mono text-white">
              {formatBytes(container.stats.memory.usage)} / {formatBytes(container.stats.memory.limit)}
              <span className="text-gray-500 ml-1">({container.stats.memory.percent}%)</span>
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {isRunning && (
          <>
            <button
              onClick={() => onAction(container.id, 'restart')}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm rounded transition"
            >
              Restart
            </button>
            <button
              onClick={() => onAction(container.id, 'stop')}
              disabled={loading}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition"
            >
              Stop
            </button>
          </>
        )}
        {isStopped && (
          <button
            onClick={() => onAction(container.id, 'start')}
            disabled={loading}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition"
          >
            Start
          </button>
        )}
        <button
          onClick={() => onViewLogs(container.id)}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
        >
          Logs
        </button>
      </div>
    </div>
  );
}
