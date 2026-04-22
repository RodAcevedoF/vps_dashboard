import type { Request, Response, NextFunction } from 'express';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.DASHBOARD_TOKEN;

  if (!expectedToken) {
    console.error('DASHBOARD_TOKEN not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (token !== expectedToken) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
}
