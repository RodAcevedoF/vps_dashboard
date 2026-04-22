import type { Request, Response, NextFunction } from 'express';

export default function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.DASHBOARD_TOKEN;

  if (!expectedToken) {
    console.error('DASHBOARD_TOKEN not configured');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (token !== expectedToken) {
    res.status(403).json({ error: 'Invalid token' });
    return;
  }

  next();
}
