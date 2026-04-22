const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3010/api';

function getAuthToken(): string | null {
  return localStorage.getItem('dashboard_token');
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (token: string) => {
    const response = await fetch(`${API_BASE.replace('/api', '')}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const data = await response.json();
    localStorage.setItem('dashboard_token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('dashboard_token');
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Containers
  getContainers: () => fetchAPI('/containers'),

  startContainer: (id: string) =>
    fetchAPI(`/containers/${id}/start`, { method: 'POST' }),

  stopContainer: (id: string) =>
    fetchAPI(`/containers/${id}/stop`, { method: 'POST' }),

  restartContainer: (id: string) =>
    fetchAPI(`/containers/${id}/restart`, { method: 'POST' }),

  // Health checks
  getRedisHealth: () => fetchAPI('/health/redis'),
  getPostgresHealth: () => fetchAPI('/health/postgres'),
  getNeo4jHealth: () => fetchAPI('/health/neo4j'),
  getApiHealth: (env: 'prod' | 'staging') => fetchAPI(`/health/api/${env}`),

  // Queues
  getQueues: () => fetchAPI('/queues'),

  // Log streaming
  streamLogs: (containerId: string, onMessage: (log: string) => void) => {
    const token = getAuthToken();
    const eventSource = new EventSource(
      `${API_BASE}/containers/${containerId}/logs`,
      {
        withCredentials: true,
      }
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data.log);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return eventSource;
  },
};
