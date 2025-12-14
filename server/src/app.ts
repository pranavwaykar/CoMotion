import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import ridesRouter from './routes/rides';

export function createApp() {
  const app = express();
  // Allow CSV list of origins; wildcard '*' for dev convenience
  const allowed = (config.corsOrigin || '').split(',').map((s) => s.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowed.includes('*') || allowed.includes(origin)) return callback(null, true);
        // Permit any localhost/127.0.0.1 port if a localhost entry is present in allowed
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin);
        const localhostAllowed = allowed.some((o) => /^http:\/\/(localhost|127\.0\.0\.1)/i.test(o));
        if (isLocalhost && localhostAllowed) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/rides', ridesRouter);

  // Basic error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status ?? 500;
    const message = err.message ?? 'Internal Server Error';
    res.status(status).json({ error: message });
  });

  return app;
}


