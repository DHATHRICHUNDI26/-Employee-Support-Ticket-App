import express from 'express';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, PRIORITIES, STATUSES } from './db.js';
import * as view from './views.js';

const publicDir = fileURLToPath(new URL('../public', import.meta.url));
const NEW_TICKET_VALUES = { title: '', description: '', category: CATEGORIES[0], priority: PRIORITIES[1] };

function cookieValue(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function parseId(raw) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function validateTicketFields(body) {
  const errors = [];
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const category = String(body.category ?? '');
  const priority = String(body.priority ?? '');

  if (!title) errors.push('Title is required.');
  else if (title.length > 100) errors.push('Title must be at most 100 characters.');
  if (!description) errors.push('Description is required.');
  if (!CATEGORIES.includes(category)) errors.push('Choose a valid category.');
  if (!PRIORITIES.includes(priority)) errors.push('Choose a valid priority.');

  return { errors, values: { title, description, category, priority } };
}

/** Build the Express app around a database handle (allows an in-memory DB in tests). */
export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: false }));
  app.use('/static', express.static(publicDir));

  const fail = (req, res, status, message) =>
    res.status(status).send(view.renderError({ status, message, user: req.user }));

  const getTicket = (id) => db.prepare(`
    SELECT t.*, u.display_name AS author_name
    FROM tickets t JOIN users u ON u.id = t.created_by
    WHERE t.id = ?
  `).get(id);

  const getComments = (id) => db.prepare(`
    SELECT c.*, u.display_name AS author_name
    FROM comments c JOIN users u ON u.id = c.author_id
    WHERE c.ticket_id = ? ORDER BY c.id ASC
  `).all(id);

  const canView = (user, ticket) => user.role === 'support' || ticket.created_by === user.id;
  const canEdit = (user, ticket) => ticket.created_by === user.id && ticket.status !== 'Closed';

  // Demo sign-in: the session is stored server-side and the cookie is opaque.
  app.use((req, res, next) => {
    const token = cookieValue(req.headers.cookie, 'sid');
    req.sessionToken = token;
    req.user = token
      ? db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`).get(token) ?? null
      : null;
    next();
  });

  const requireUser = (req, res, next) =>
    req.user ? next() : fail(req, res, 401, 'Please sign in to continue.');

  app.get('/signin', (req, res) => {
    if (req.user) return res.redirect('/');
    res.send(view.renderSignin(db.prepare('SELECT * FROM users ORDER BY id').all()));
  });

  app.post('/signin', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(parseId(req.body.userId));
    if (!user) return fail(req, res, 400, 'Choose a valid demo user.');
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)')
      .run(token, user.id, new Date().toISOString());
    res.cookie('sid', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect('/');
  });

  app.post('/signout', (req, res) => {
    if (req.sessionToken) db.prepare('DELETE FROM sessions WHERE token = ?').run(req.sessionToken);
    res.clearCookie('sid', { path: '/' });
    res.redirect('/signin');
  });

  app.get('/health', (req, res) => {
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM tickets').get();
    res.json({ ok: true, tickets: n });
  });

  app.get('/', requireUser, (req, res) => {
    const filters = {
      status: STATUSES.includes(req.query.status) ? req.query.status : '',
      category: CATEGORIES.includes(req.query.category) ? req.query.category : '',
      priority: PRIORITIES.includes(req.query.priority) ? req.query.priority : '',
      q: typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '',
    };
    const conditions = [];
    const params = [];
    if (req.user.role !== 'support') {
      conditions.push('t.created_by = ?');
      params.push(req.user.id);
    }
    if (filters.status) { conditions.push('t.status = ?'); params.push(filters.status); }
    if (filters.category) { conditions.push('t.category = ?'); params.push(filters.category); }
    if (filters.priority) { conditions.push('t.priority = ?'); params.push(filters.priority); }
    if (filters.q) {
      const term = `%${filters.q.replace(/[%_]/g, '')}%`;
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(term, term);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const tickets = db.prepare(`
      SELECT t.*, u.display_name AS author_name
      FROM tickets t JOIN users u ON u.id = t.created_by
      ${where}
      ORDER BY t.updated_at DESC, t.id DESC
    `).all(...params);
    res.send(view.renderList(req.user, tickets, filters));
  });

  app.get('/tickets/new', requireUser, (req, res) => {
    res.send(view.renderTicketForm({ user: req.user, mode: 'new', values: NEW_TICKET_VALUES }));
  });

  app.post('/tickets', requireUser, (req, res) => {
    const { errors, values } = validateTicketFields(req.body);
    if (errors.length) {
      return res.status(400).send(view.renderTicketForm({
        user: req.user, mode: 'new', values, error: errors.join(' '),
      }));
    }
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO tickets (title, description, category, priority, status, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'Open', ?, ?, ?)
    `).run(values.title, values.description, values.category, values.priority, req.user.id, now, now);
    res.redirect(`/tickets/${result.lastInsertRowid}`);
  });

  app.get('/tickets/:id', requireUser, (req, res) => {
    const ticket = getTicket(parseId(req.params.id));
    if (!ticket) return fail(req, res, 404, 'Ticket not found.');
    if (!canView(req.user, ticket)) return fail(req, res, 403, 'You do not have access to this ticket.');
    res.send(view.renderDetail({ ticket, comments: getComments(ticket.id), user: req.user }));
  });

  app.get('/tickets/:id/edit', requireUser, (req, res) => {
    const ticket = getTicket(parseId(req.params.id));
    if (!ticket) return fail(req, res, 404, 'Ticket not found.');
    if (!canView(req.user, ticket)) return fail(req, res, 403, 'You do not have access to this ticket.');
    if (!canEdit(req.user, ticket)) return fail(req, res, 403, 'This ticket cannot be edited.');
    res.send(view.renderTicketForm({ user: req.user, mode: 'edit', ticket, values: ticket }));
  });

  app.post('/tickets/:id/edit', requireUser, (req, res) => {
    const ticket = getTicket(parseId(req.params.id));
    if (!ticket) return fail(req, res, 404, 'Ticket not found.');
    if (!canView(req.user, ticket)) return fail(req, res, 403, 'You do not have access to this ticket.');
    if (!canEdit(req.user, ticket)) return fail(req, res, 403, 'This ticket cannot be edited.');
    const { errors, values } = validateTicketFields(req.body);
    if (errors.length) {
      return res.status(400).send(view.renderTicketForm({
        user: req.user, mode: 'edit', ticket, values, error: errors.join(' '),
      }));
    }
    db.prepare(`
      UPDATE tickets SET title = ?, description = ?, category = ?, priority = ?, updated_at = ? WHERE id = ?
    `).run(values.title, values.description, values.category, values.priority, new Date().toISOString(), ticket.id);
    res.redirect(`/tickets/${ticket.id}`);
  });

  app.use((req, res) => fail(req, res, 404, 'Page not found.'));
  app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);
    fail(req, res, 500, 'Something went wrong. Please try again.');
  });

  return app;
}
