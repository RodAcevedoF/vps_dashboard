import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import authMiddleware from './middleware/auth';
import containersRouter from './routes/containers';
import healthRouter from './routes/health';
import queuesRouter from './routes/queues';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(cors());
app.use(express.json());

// Public routes (login, etc.)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { token } = req.body;
  if (token === process.env.DASHBOARD_TOKEN) {
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Protected API routes
app.use('/api/containers', authMiddleware, containersRouter);
app.use('/api/health', authMiddleware, healthRouter);
app.use('/api/queues', authMiddleware, queuesRouter);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Dashboard server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
