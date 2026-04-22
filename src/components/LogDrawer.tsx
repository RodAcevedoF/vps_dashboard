import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

interface LogDrawerProps {
  containerId: string | null;
  containerName: string;
  onClose: () => void;
}

export default function LogDrawer({ containerId, containerName, onClose }: LogDrawerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!containerId) return;

    // Stream logs via SSE
    const eventSource = api.streamLogs(containerId, (log) => {
      setLogs((prev) => [...prev, log]);
    });

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
    };
  }, [containerId]);

  useEffect(() => {
    // Auto-scroll to bottom
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!containerId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-gray-900 w-full max-w-4xl h-2/3 rounded-t-lg flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Logs: {containerName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 font-mono text-xs bg-black">
          {logs.length === 0 ? (
            <p className="text-gray-500">Waiting for logs...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-gray-300 whitespace-pre-wrap break-all">
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
