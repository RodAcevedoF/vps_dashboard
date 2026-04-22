import express, { type Request, type Response } from 'express';
import { createClient } from 'redis';
import { Pool } from 'pg';
import neo4j from 'neo4j-driver';

const router = express.Router();

// Redis health check
router.get('/redis', async (_req: Request, res: Response) => {
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
    const pong = await client.ping();

    res.json({
      status: 'healthy',
      response: pong,
      host: redisHost,
      port: redisPort,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(503).json({
      status: 'unhealthy',
      error: message,
    });
  } finally {
    if (client) {
      await client.quit();
    }
  }
});

// PostgreSQL health check
router.get('/postgres', async (_req: Request, res: Response) => {
  let pool;
  try {
    const connectionString = process.env.DATABASE_URL ||
      `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'postgres'}`;

    pool = new Pool({ connectionString });
    const result = await pool.query('SELECT 1 as health');

    res.json({
      status: 'healthy',
      response: result.rows[0],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(503).json({
      status: 'unhealthy',
      error: message,
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
});

// Neo4j health check
router.get('/neo4j', async (_req: Request, res: Response) => {
  let driver;
  let session;
  try {
    const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const neo4jUser = process.env.NEO4J_USER || 'neo4j';
    const neo4jPassword = process.env.NEO4J_PASSWORD || 'password';

    driver = neo4j.driver(
      neo4jUri,
      neo4j.auth.basic(neo4jUser, neo4jPassword)
    );

    session = driver.session();
    const result = await session.run('RETURN 1 as health');

    res.json({
      status: 'healthy',
      response: result.records[0]?.get('health'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(503).json({
      status: 'unhealthy',
      error: message,
    });
  } finally {
    if (session) {
      await session.close();
    }
    if (driver) {
      await driver.close();
    }
  }
});

// API endpoint health check
router.get('/api/:env', async (req: Request, res: Response) => {
  try {
    const { env } = req.params;
    const apiUrl = env === 'staging'
      ? process.env.STAGING_API_URL || 'http://localhost:3002'
      : process.env.PROD_API_URL || 'http://localhost:3001';

    const response = await fetch(`${apiUrl}/health`);
    const data = await response.json();

    res.json({
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      response: data,
      url: apiUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(503).json({
      status: 'unhealthy',
      error: message,
    });
  }
});

export default router;
