import app from './app';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { logger } from './config/logger';
import { ConfigService } from './services/config.service';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer(): Promise<void> {
  try {
    logger.info('🚀 Starting AfWeather Backend Server...');

    // Initialize database (optional - will warn if not available)
    try {
      logger.info('📊 Connecting to PostgreSQL...');
      await initializeDatabase();
      logger.info('✅ PostgreSQL connected');
    } catch (error) {
      logger.warn('⚠️  PostgreSQL not available - some features will be limited');
      logger.warn('Add DATABASE_URL environment variable to enable database');
    }

    // Initialize Redis (optional - will warn if not available)
    try {
      logger.info('🔴 Connecting to Redis...');
      await initializeRedis();
      logger.info('✅ Redis connected');
    } catch (error) {
      logger.warn('⚠️  Redis not available - caching disabled');
      logger.warn('Add REDIS_URL environment variable to enable caching');
    }

    // Initialize default configurations (optional)
    try {
      logger.info('⚙️  Initializing configurations...');
      const configService = new ConfigService();
      await configService.initializeDefaults();
    } catch (error) {
      logger.warn('⚠️  Could not initialize default configurations');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info('✅ Server started successfully!');
      logger.info(`🌍 Environment: ${NODE_ENV}`);
      logger.info(`🔗 Server running on port ${PORT}`);
      logger.info(`📡 API available at: http://localhost:${PORT}/api`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
      logger.info('');
      logger.info('🌾 AfWeather Backend - Serving billions of farmers globally');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
