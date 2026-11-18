import express from 'express';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../public', import.meta.url));

/** Build the Express app around a database handle (allows an in-memory DB in tests). */
export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: false }));
  app.use('/static', express.static(publicDir));

  app.get('/health', (req, res) => {
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM tickets').get();
    res.json({ ok: true, tickets: n });
  });

  app.use((req, res) => {
    res.status(404).type('text').send('Not found');
  });

  return app;
}
