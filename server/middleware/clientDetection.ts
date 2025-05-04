import { Request, Response, NextFunction } from 'express';

export type ClientType = 'electron' | 'mobile' | 'web';

declare global {
  namespace Express {
    interface Request {
      clientType: ClientType;
    }
  }
}

export function detectClient(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.get('User-Agent') || '';
  const clientHeader = req.get('X-Client-Type');

  // Prioritize explicit client header if present
  if (clientHeader === 'electron') {
    req.clientType = 'electron';
  } else if (userAgent.includes('Electron/')) {
    req.clientType = 'electron';
  } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    req.clientType = 'mobile';
  } else {
    req.clientType = 'web';
  }

  // Add client type to response headers for debugging
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Detected-Client', req.clientType);
  }

  next();
}
