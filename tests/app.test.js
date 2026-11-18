import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';

let server;
let db;
let base;

beforeEach(async () => {
  db = createDatabase(':memory:');
  server = createApp(db).listen(0);
  if (!server.listening) await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

async function signInAs(userId) {
  const response = await fetch(`${base}/signin`, {
    method: 'POST',
    body: new URLSearchParams({ userId: String(userId) }),
    redirect: 'manual',
  });
  assert.equal(response.status, 302);
  const cookie = response.headers.getSetCookie()[0].split(';')[0];
  assert.match(cookie, /^sid=[0-9a-f]{64}$/);
  return { cookie };
}

function get(path, headers) {
  return fetch(`${base}${path}`, { headers });
}

function post(path, headers, fields) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(fields),
    redirect: 'manual',
  });
}

const FIELDS = {
  title: 'Printer jammed',
  description: 'The printer on floor 2 is jammed.',
  category: 'Hardware',
  priority: 'Medium',
};

test('seed data matches the sample tickets and users', () => {
  const tickets = db.prepare('SELECT * FROM tickets ORDER BY id').all();
  assert.equal(tickets.length, 5);
  assert.deepEqual(tickets.map((t) => t.status), ['Open', 'In Progress', 'Open', 'Resolved', 'Closed']);
  assert.equal(tickets[0].title, 'Laptop not charging');
  assert.equal(tickets[0].created_by, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'support'").get().n, 1);
});

test('anonymous requests cannot see tickets', async () => {
  const response = await get('/');
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Please sign in/);
});

test('employees see only their own tickets; support sees all', async () => {
  const ravi = await signInAs(1);
  const sam = await signInAs(3);

  const raviPage = await (await get('/', ravi)).text();
  assert.match(raviPage, /Laptop not charging/);
  assert.doesNotMatch(raviPage, /Need access to the shared project folder/);

  const samPage = await (await get('/', sam)).text();
  assert.match(samPage, /Laptop not charging/);
  assert.match(samPage, /Need access to the shared project folder/);
});

test('creating a ticket sets author, Open status and timestamps', async () => {
  const ravi = await signInAs(1);
  const response = await post('/tickets', ravi, FIELDS);
  assert.equal(response.status, 302);
  assert.match(response.headers.get('location'), /^\/tickets\/\d+$/);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = 6').get();
  assert.equal(ticket.title, FIELDS.title);
  assert.equal(ticket.created_by, 1);
  assert.equal(ticket.status, 'Open');
  assert.equal(ticket.created_at, ticket.updated_at);
});

test('title and description validation rejects empty and overlong values', async () => {
  const ravi = await signInAs(1);

  const empty = await post('/tickets', ravi, { ...FIELDS, title: '  ', description: '' });
  assert.equal(empty.status, 400);
  assert.match(await empty.text(), /Title is required/);

  const long = await post('/tickets', ravi, { ...FIELDS, title: 'x'.repeat(101) });
  assert.equal(long.status, 400);
  assert.match(await long.text(), /at most 100 characters/);

  const badEnum = await post('/tickets', ravi, { ...FIELDS, priority: 'Urgent' });
  assert.equal(badEnum.status, 400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tickets').get().n, 5);
});

test('creator can edit a non-Closed ticket, but not a Closed one or another user ticket', async () => {
  const ravi = await signInAs(1);
  const priya = await signInAs(2);

  const edited = await post('/tickets/1/edit', ravi, { ...FIELDS, title: 'Updated title' });
  assert.equal(edited.status, 302);
  assert.equal(db.prepare('SELECT title FROM tickets WHERE id = 1').get().title, 'Updated title');

  const closed = await post('/tickets/5/edit', ravi, { ...FIELDS });
  assert.equal(closed.status, 403);
  assert.match(await closed.text(), /cannot be edited/);

  const otherUser = await post('/tickets/3/edit', ravi, { ...FIELDS });
  assert.equal(otherUser.status, 403);
});

test('only support staff can change status, and only forwards', async () => {
  const ravi = await signInAs(1);
  const sam = await signInAs(3);

  assert.equal((await post('/tickets/1/status', ravi, { status: 'In Progress' })).status, 403);
  assert.equal((await post('/tickets/1/status', sam, { status: 'In Progress' })).status, 302);
  assert.equal(db.prepare('SELECT status FROM tickets WHERE id = 1').get().status, 'In Progress');

  const backward = await post('/tickets/1/status', sam, { status: 'Open' });
  assert.equal(backward.status, 400);
  assert.match(await backward.text(), /only move forward/);

  const invalid = await post('/tickets/1/status', sam, { status: 'Banana' });
  assert.equal(invalid.status, 400);
});

test('comments work on Closed tickets, are trimmed, and refresh updated_at', async () => {
  const ravi = await signInAs(1);
  const priya = await signInAs(2);
  const before = db.prepare('SELECT updated_at FROM tickets WHERE id = 5').get().updated_at;
  // Ticket #5 is seeded with a later same-day timestamp than the lab's current clock,
  // so compare for change rather than ordering.

  const added = await post('/tickets/5/comments', ravi, { body: '  Please keep the monitor request open.  ' });
  assert.equal(added.status, 302);
  assert.match(added.headers.get('location'), /\/tickets\/5#comments$/);

  const comment = db.prepare('SELECT * FROM comments ORDER BY id DESC LIMIT 1').get();
  assert.equal(comment.body, 'Please keep the monitor request open.');
  assert.equal(comment.author_id, 1);
  assert.equal(comment.ticket_id, 5);
  assert.notEqual(db.prepare('SELECT updated_at FROM tickets WHERE id = 5').get().updated_at, before);
  assert.equal(db.prepare('SELECT status FROM tickets WHERE id = 5').get().status, 'Closed');

  assert.equal((await post('/tickets/5/comments', ravi, { body: '   ' })).status, 400);
  assert.equal((await post('/tickets/5/comments', ravi, { body: 'x'.repeat(2001) })).status, 400);
  assert.equal((await post('/tickets/1/comments', priya, { body: 'not my ticket' })).status, 403);
});

test('rendered ticket details escape HTML input', async () => {
  const ravi = await signInAs(1);
  await post('/tickets', ravi, { ...FIELDS, title: '<script>alert(1)</script>' });
  const page = await (await get('/tickets/6', ravi)).text();
  assert.doesNotMatch(page, /<script>alert\(1\)<\/script>/);
  assert.match(page, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('regression D-1: last-updated time is visible and changes after an edit', async () => {
  const ravi = await signInAs(1);
  const shown = (html) => html.match(/Last updated:<\/strong> ([^<]+)/)[1].trim();
  const before = shown(await (await get('/tickets/1', ravi)).text());
  assert.match(before, /18 Nov 2026, \d{2}:\d{2} UTC/);

  await post('/tickets/1/edit', ravi, { ...FIELDS });
  const after = shown(await (await get('/tickets/1', ravi)).text());
  assert.notEqual(after, before);
});

test('list filters combine with role visibility', async () => {
  const ravi = await signInAs(1);
  const page = await (await get('/?status=Closed&category=Hardware', ravi)).text();
  assert.match(page, /1 ticket shown/);
  assert.match(page, /Request a second monitor/);
  assert.doesNotMatch(page, /Laptop not charging/);
});

test('sign out invalidates the session', async () => {
  const ravi = await signInAs(1);
  const out = await post('/signout', ravi, {});
  assert.equal(out.status, 302);
  const response = await get('/', ravi);
  assert.equal(response.status, 401);
});
