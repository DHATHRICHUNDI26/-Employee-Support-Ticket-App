import express from 'express';
import { createApp } from './app.js';
import { createDatabase } from './db.js';

const db = createDatabase();
const app = createApp(db);
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Support ticket app listening on http://localhost:${port}`);
});
