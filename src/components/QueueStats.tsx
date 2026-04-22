import type { QueueStats } from '../types';

interface QueueStatsProps {
  queues: QueueStats[];
  loading: boolean;
}

export default function QueueStatsComponent({ queues, loading }: QueueStatsProps) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Queue Stats</h2>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (queues.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Queue Stats</h2>
        <div className="text-gray-400">No queues found</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">Queue Stats</h2>
      <div className="space-y-4">
        {queues.map((queue) => (
          <div key={queue.name} className="bg-gray-900/50 rounded p-3">
            <h3 className="text-white font-medium mb-2">{queue.name}</h3>
            <div className="grid grid-cols-5 gap-2 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Waiting</p>
                <p className="text-yellow-400 font-mono">{queue.waiting}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Active</p>
                <p className="text-blue-400 font-mono">{queue.active}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Completed</p>
                <p className="text-green-400 font-mono">{queue.completed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Failed</p>
                <p className="text-red-400 font-mono">{queue.failed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Delayed</p>
                <p className="text-purple-400 font-mono">{queue.delayed}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
