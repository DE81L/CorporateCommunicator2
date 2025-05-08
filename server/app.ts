import express, { Request, Response } from 'express';
import { connectDb } from './db';
import router from './routes';
import cors from 'cors';

async function createApp() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  app.use('/api', router);
  
  await connectDb();
  console.log('✓ DB connected');
  
  app.get('/', (_req: Request, res: Response) => {
    res.send('✅ Server is running');
  });

  return app;
}

if (require.main === module) {
  createApp().then(app => {
    const port = Number(process.env.PORT) || 3000;
    app.listen(port, () => {
      console.log(`🚀 Server listening on http://localhost:${port}`);
    });
  });
}

export { createApp };
