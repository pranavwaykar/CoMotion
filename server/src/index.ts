import http from 'http';
import mongoose from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config';

async function main() {
  const app = createApp();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: config.corsOrigin },
  });

  // Expose io to routes via app locals
  app.set('io', io);

  io.on('connection', (socket) => {
    // Optionally, authenticate sockets later
    socket.on('disconnect', () => {
      // no-op
    });
  });

  if (config.mongoUrl === 'memory') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    const uri = mem.getUri('commute');
    await mongoose.connect(uri);
    // eslint-disable-next-line no-console
    console.log('Connected to in-memory MongoDB');
  } else {
    await mongoose.connect(config.mongoUrl);
  }

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log('Shutting down server...');
    await mongoose.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


