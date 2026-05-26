import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

// Ensure DB connection is established before handling requests in serverless.
app.use(async (req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    next(e);
  }
});

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
