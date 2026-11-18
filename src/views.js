import { CATEGORIES, PRIORITIES, STATUSES } from './db.js';

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

export function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso ?? '');
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

export function formatDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return formatDate(iso);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  }).format(date);
  return `${formatDate(iso)}, ${time} UTC`;
}

function roleLabel(role) {
  return role === 'support' ? 'Support staff' : 'Employee';
}

function layout(title, user, body) {
  const identity = user
    ? `<span>${escapeHtml(user.display_name)} <span class="muted">(${roleLabel(user.role)})</span></span>
       <form method="post" action="/signout" style="display:inline"><button class="secondary" type="submit">Sign out</button></form>`
    : '<span class="muted">Not signed in</span>';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · Support Tickets</title>
  <link rel="stylesheet" href="/static/styles.css">
  <script src="/static/app.js" defer></script>
</head>
<body>
  <header class="app-header">
    <a href="/">Support Tickets</a>
    <div style="display:flex;gap:1rem;align-items:center">${identity}</div>
  </header>
  <main>${body}</main>
</body>
</html>`;
}

function selectOptions(values, selected) {
  return values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('');
}

export function renderSignin(users) {
  const cards = users.map((user) => `
    <div class="card">
      <strong>${escapeHtml(user.display_name)}</strong>
      <span class="muted">${roleLabel(user.role)}</span>
      <form method="post" action="/signin">
        <input type="hidden" name="userId" value="${user.id}">
        <button type="submit">Sign in as ${escapeHtml(user.display_name)}</button>
      </form>
    </div>`).join('');
  return layout('Sign in', null, `
    <h1>Sign in</h1>
    <p>Choose a demo user. Employees see only their own tickets; support staff see all tickets.</p>
    ${cards}`);
}

export function renderList(user, tickets, filters = {}) {
  const rows = tickets.map((ticket) => `
    <tr>
      <td><a href="/tickets/${ticket.id}">${escapeHtml(ticket.title)}</a></td>
      <td>${escapeHtml(ticket.category)}</td>
      <td>${escapeHtml(ticket.priority)}</td>
      <td><span class="badge">${escapeHtml(ticket.status)}</span></td>
      <td>${escapeHtml(ticket.author_name)}</td>
      <td>${escapeHtml(formatDateTime(ticket.updated_at))}</td>
    </tr>`).join('');

  return layout('Tickets', user, `
    <h1>${user.role === 'support' ? 'All tickets' : 'My tickets'}</h1>
    <p class="muted">${tickets.length} ticket${tickets.length === 1 ? '' : 's'} shown.</p>
    <p><a class="button" href="/tickets/new">New ticket</a></p>
    <form class="card filters" method="get" action="/">
      <label>Status
        <select name="status"><option value="">Any</option>${selectOptions(STATUSES, filters.status)}</select>
      </label>
      <label>Category
        <select name="category"><option value="">Any</option>${selectOptions(CATEGORIES, filters.category)}</select>
      </label>
      <label>Priority
        <select name="priority"><option value="">Any</option>${selectOptions(PRIORITIES, filters.priority)}</select>
      </label>
      <label>Search
        <input type="search" name="q" value="${escapeHtml(filters.q ?? '')}" placeholder="Title or description">
      </label>
      <button class="secondary" type="submit">Filter</button>
    </form>
    ${tickets.length ? `<table>
      <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Created by</th><th>Last updated</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>` : '<div class="card">No tickets match your selection.</div>'}`);
}

export function renderTicketForm({ user, mode, values, error, ticket }) {
  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit ticket' : 'New ticket';
  const action = isEdit ? `/tickets/${ticket.id}/edit` : '/tickets';
  const statusNote = isEdit ? `<p class="muted">Status: <span class="badge">${escapeHtml(ticket.status)}</span> (support staff only)</p>` : '';
  return layout(title, user, `
    <h1>${title}</h1>
    ${error ? `<div class="card error">${escapeHtml(error)}</div>` : ''}
    ${statusNote}
    <div class="card">
      <form method="post" action="${action}">
        <label for="title">Title (required, max 100 characters)</label>
        <input id="title" name="title" type="text" maxlength="100" required value="${escapeHtml(values.title)}">

        <label for="description">Description (required)</label>
        <textarea id="description" name="description" required>${escapeHtml(values.description)}</textarea>

        <label for="category">Category</label>
        <select id="category" name="category">${selectOptions(CATEGORIES, values.category)}</select>

        <label for="priority">Priority</label>
        <select id="priority" name="priority">${selectOptions(PRIORITIES, values.priority)}</select>

        <div class="actions">
          <button type="submit">${isEdit ? 'Save changes' : 'Create ticket'}</button>
          <a class="button secondary" href="${isEdit ? `/tickets/${ticket.id}` : '/'}">Cancel</a>
        </div>
      </form>
    </div>`);
}

export function renderDetail({ ticket, comments, user, commentError, commentBody = '' }) {
  const canEdit = ticket.created_by === user.id && ticket.status !== 'Closed';
  const nextStatuses = STATUSES.slice(STATUSES.indexOf(ticket.status) + 1);
  const statusControl = user.role !== 'support'
    ? '<p class="muted">Only support staff can change the status.</p>'
    : nextStatuses.length === 0
      ? '<p class="notice">This ticket is closed. Its status can no longer be changed.</p>'
      : `<form method="post" action="/tickets/${ticket.id}/status">
          <label for="status">Change status</label>
          <select id="status" name="status">${selectOptions(nextStatuses, nextStatuses[0])}</select>
          <button type="submit">Update status</button>
        </form>`;

  const commentList = comments.length
    ? comments.map((comment) => `
      <div class="comment">
        <strong>${escapeHtml(comment.author_name)}</strong>
        <span class="muted">${escapeHtml(formatDate(comment.created_at))}</span>
        <p>${escapeHtml(comment.body)}</p>
      </div>`).join('')
    : '<p class="muted">No comments yet.</p>';

  return layout(ticket.title, user, `
    <p><a href="/">← Back to tickets</a></p>
    <h1>${escapeHtml(ticket.title)}</h1>
    <div class="card">
      <p><strong>Status:</strong> <span class="badge">${escapeHtml(ticket.status)}</span></p>
      <p><strong>Category:</strong> ${escapeHtml(ticket.category)} &nbsp; <strong>Priority:</strong> ${escapeHtml(ticket.priority)}</p>
      <p><strong>Created by:</strong> ${escapeHtml(ticket.author_name)}</p>
      <p><strong>Created:</strong> ${escapeHtml(formatDate(ticket.created_at))} &nbsp; <strong>Last updated:</strong> ${escapeHtml(formatDateTime(ticket.updated_at))}</p>
      <p><strong>Description:</strong><br>${escapeHtml(ticket.description)}</p>
      ${canEdit ? `<p><a class="button secondary" href="/tickets/${ticket.id}/edit">Edit ticket</a></p>` : ''}
      ${ticket.status === 'Closed' ? '<p class="muted">This ticket is closed and cannot be edited. Comments are still welcome.</p>' : ''}
    </div>
    <div class="card">${statusControl}</div>
    <div class="card" id="comments">
      <h2>Comments</h2>
      ${commentList}
      <h3>Add a comment</h3>
      ${commentError ? `<div class="card error">${escapeHtml(commentError)}</div>` : ''}
      <form method="post" action="/tickets/${ticket.id}/comments">
        <label for="body">Comment (max 2000 characters)</label>
        <textarea id="body" name="body" maxlength="2000" required>${escapeHtml(commentBody)}</textarea>
        <button type="submit">Add comment</button>
      </form>
    </div>`);
}

export function renderError({ status, message, user }) {
  return layout(`Error ${status}`, user, `
    <div class="card error">
      <h1>${status} error</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/">Back to tickets</a></p>
    </div>`);
}
