import { createApp } from './app';

/**
 * Main server entry point with environment detection
 */
async function startServer() {
  const { app, server } = await createApp();
  
  // Determine the port based on environment
  const PORT = process.env.ELECTRON === 'true' 
    ? 3000 
    : (process.env.PORT 
        ? parseInt(process.env.PORT, 10) 
        : 3000);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Handle termination gracefully
  const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  return server;
}

// Start the server if this is the main module
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { startServer };