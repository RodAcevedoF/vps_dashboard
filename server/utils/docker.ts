import Docker from 'dockerode';
import type { Readable } from 'node:stream';

// Create Docker client using Unix socket
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export async function listContainers() {
  try {
    const containers = await docker.listContainers({ all: true });
    return containers.map(container => ({
      id: container.Id,
      name: container.Names[0]?.replace(/^\//, '') || '',
      image: container.Image,
      state: container.State,
      status: container.Status,
      created: container.Created,
      labels: container.Labels,
      ports: container.Ports,
    }));
  } catch (error) {
    console.error('Error listing containers:', error);
    throw error;
  }
}

export async function getContainerStats(containerId: string) {
  try {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    // Calculate CPU percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // Calculate memory usage
    const memUsage = stats.memory_stats.usage;
    const memLimit = stats.memory_stats.limit;
    const memPercent = (memUsage / memLimit) * 100;

    return {
      cpu: cpuPercent.toFixed(2),
      memory: {
        usage: memUsage,
        limit: memLimit,
        percent: memPercent.toFixed(2),
      },
    };
  } catch (error) {
    console.error(`Error getting stats for container ${containerId}:`, error);
    return null;
  }
}

export async function containerAction(containerId: string, action: 'start' | 'stop' | 'restart') {
  try {
    const container = docker.getContainer(containerId);

    switch (action) {
      case 'start':
        await container.start();
        break;
      case 'stop':
        await container.stop();
        break;
      case 'restart':
        await container.restart();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return { success: true };
  } catch (error) {
    console.error(`Error performing ${action} on container ${containerId}:`, error);
    throw error;
  }
}

export async function getContainerLogs(containerId: string, tail = 100) {
  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });

    return logs.toString('utf8');
  } catch (error) {
    console.error(`Error getting logs for container ${containerId}:`, error);
    throw error;
  }
}

export async function streamContainerLogs(containerId: string, onData: (data: string) => void) {
  try {
    const container = docker.getContainer(containerId);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 100,
      timestamps: true,
    }) as unknown as Readable;

    stream.on('data', (chunk: Buffer) => {
      onData(chunk.toString('utf8'));
    });

    return stream;
  } catch (error) {
    console.error(`Error streaming logs for container ${containerId}:`, error);
    throw error;
  }
}

export { docker };
