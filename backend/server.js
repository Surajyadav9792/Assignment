import app from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { logger } from './src/utils/logger.js';

// On Vercel (serverless), simply export the Express app — Vercel's @vercel/node
// runtime treats it as the request handler. DB connections are cached in
// src/config/db.js via the global._ffMongo trick.
//
// Locally (or on any traditional Node host), we start a long-running listener.
if (!process.env.VERCEL) {
  (async () => {
    try {
      await connectDB();
      app.listen(env.PORT, () =>
        logger.info(`ForgeFlow API listening on :${env.PORT}`)
      );
    } catch (err) {
      logger.error(`Failed to start: ${err.message}`);
      process.exit(1);
    }
  })();
}

export default app;
