export interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  labels: Record<string, string>;
  ports: Array<{
    IP?: string;
    PrivatePort: number;
    PublicPort?: number;
    Type: string;
  }>;
  stats?: {
    cpu: string;
    memory: {
      usage: number;
      limit: number;
      percent: string;
    };
  };
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  error?: string;
  response?: unknown;
  host?: string;
  port?: number;
  url?: string;
  statusCode?: number;
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
