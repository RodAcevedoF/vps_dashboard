import express, { type Request, type Response } from 'express';
import { createClient } from 'redis';

const router = express.Router();

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// Get BullMQ queue depths
router.get('/', async (req: Request, res: Response) => {
  let client;
  try {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = Number(process.env.REDIS_PORT) || 6379;

    client = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });

    await client.connect();

    // Get all keys matching BullMQ queue patterns
    const keys = await client.keys('bull:*');

    // Group by queue name and get counts
    const queueStats: Record<string, QueueStats> = {};

    for (const key of keys) {
      // BullMQ keys format: bull:queueName:state
      const parts = key.split(':');
      if (parts.length >= 3) {
        const queueName = parts[1];
        const state = parts[2];

        if (!queueStats[queueName]) {
          queueStats[queueName] = {
            name: queueName,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
          };
        }

        // Get count for this state
        const type = await client.type(key);
        let count = 0;

        if (type === 'list') {
          count = await client.lLen(key);
        } else if (type === 'set') {
          count = await client.sCard(key);
        } else if (type === 'zset') {
          count = await client.zCard(key);
        }

        if (state === 'wait') queueStats[queueName].waiting = count;
        else if (state === 'active') queueStats[queueName].active = count;
        else if (state === 'completed') queueStats[queueName].completed = count;
        else if (state === 'failed') queueStats[queueName].failed = count;
        else if (state === 'delayed') queueStats[queueName].delayed = count;
      }
    }

    res.json(Object.values(queueStats));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  } finally {
    if (client) {
      await client.quit();
    }
  }
});

export default router;
