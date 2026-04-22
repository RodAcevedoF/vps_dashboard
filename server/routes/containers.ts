import express, { type Request, type Response } from 'express';
import {
  listContainers,
  getContainerStats,
  containerAction,
  streamContainerLogs,
} from '../utils/docker';

const router = express.Router();

// GET /api/containers - List all containers with stats
router.get('/', async (req: Request, res: Response) => {
  try {
    const containers = await listContainers();

    // Optionally fetch stats for each running container
    const containersWithStats = await Promise.all(
      containers.map(async (container) => {
        if (container.state === 'running') {
          const stats = await getContainerStats(container.id);
          return { ...container, stats };
        }
        return container;
      })
    );

    res.json(containersWithStats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/containers/:id/start
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const result = await containerAction(String(req.params.id), 'start');
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/containers/:id/stop
router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const result = await containerAction(String(req.params.id), 'stop');
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// POST /api/containers/:id/restart
router.post('/:id/restart', async (req: Request, res: Response) => {
  try {
    const result = await containerAction(String(req.params.id), 'restart');
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// GET /api/containers/:id/logs - Get container logs (SSE stream)
router.get('/:id/logs', async (req: Request, res: Response) => {
  try {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await streamContainerLogs(String(req.params.id), (data) => {
      res.write(`data: ${JSON.stringify({ log: data })}\n\n`);
    });

    // Clean up on client disconnect
    req.on('close', () => {
      stream.destroy();
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
